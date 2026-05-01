import { TestBed } from '@angular/core/testing';
import { NgZone, PLATFORM_ID } from '@angular/core';
import { TidioService } from './tidio.service';
import { environment } from '../../../environments/environment';

describe('TidioService', () => {
  let service: TidioService;

  beforeEach(() => {
    delete (window as any).tidioChatApi;
    TestBed.configureTestingModule({
      providers: [
        TidioService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    service = TestBed.inject(TidioService);
  });

  afterEach(() => {
    delete (window as any).tidioChatApi;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('load', () => {
    it('should resolve immediately on server platform', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          TidioService,
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      const serverService = TestBed.inject(TidioService);
      await expect(serverService.load()).resolves.toBeUndefined();
    });

    it('should resolve immediately when already loaded and API exists', async () => {
      (window as any).tidioChatApi = {};
      (service as any).loaded = true;
      await expect(service.load()).resolves.toBeUndefined();
    });

    it('should return existing promise when already loading', async () => {
      const fakePromise = Promise.resolve();
      (service as any).readyPromise = fakePromise;
      const result = service.load();
      expect(result).toBe(fakePromise);
    });

    it('should resolve when no public key is configured', async () => {
      const original = environment.tidioPublicKey;
      (environment as any).tidioPublicKey = 'your_tidio_public_key_here';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await service.load();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No public key'));
      consoleSpy.mockRestore();
      (environment as any).tidioPublicKey = original;
    });

    it('should resolve when public key is empty', async () => {
      const original = environment.tidioPublicKey;
      (environment as any).tidioPublicKey = '';
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      await service.load();
      consoleSpy.mockRestore();
      (environment as any).tidioPublicKey = original;
    });

    it('should create script element and resolve on tidioChat-ready', async () => {
      const appendSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((el: any) => {
        setTimeout(() => document.dispatchEvent(new Event('tidioChat-ready')), 10);
        return el;
      });

      await service.load();
      expect(appendSpy).toHaveBeenCalled();
      expect((service as any).loaded).toBe(true);
      appendSpy.mockRestore();
    });

    it('should not create a second script when scriptElement already exists', async () => {
      (service as any).scriptElement = document.createElement('script');
      const appendSpy = jest.spyOn(document.head, 'appendChild');
      const loadPromise = service.load();
      document.dispatchEvent(new Event('tidioChat-ready'));
      await loadPromise;
      expect(appendSpy).not.toHaveBeenCalled();
      appendSpy.mockRestore();
    });

    it('should resolve on script error', async () => {
      const appendSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((el: any) => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        setTimeout(() => el.onerror(), 10);
        return el;
      });

      await service.load();
      expect((service as any).readyPromise).toBeNull();
      appendSpy.mockRestore();
    });

    it('should resolve immediately if tidioChatApi is available during load', async () => {
      (window as any).tidioChatApi = { show: jest.fn() };
      const appendSpy = jest.spyOn(document.head, 'appendChild').mockImplementation((el: any) => el);
      await service.load();
      expect((service as any).loaded).toBe(true);
      appendSpy.mockRestore();
    });
  });

  describe('identifyUser', () => {
    it('should not throw when API is not available', () => {
      expect(() => service.identifyUser({ _id: '1', name: 'Test', email: 'a@b.com', role: 'buyer' } as any)).not.toThrow();
    });

    it('should call setVisitorData when API is available', () => {
      const mockApi = { setVisitorData: jest.fn(), setContactProperties: jest.fn() };
      (window as any).tidioChatApi = mockApi;
      service.identifyUser({ _id: '1', name: 'Test', email: 'a@b.com', role: 'buyer' } as any);
      expect(mockApi.setVisitorData).toHaveBeenCalledWith({ distinct_id: '1', email: 'a@b.com', name: 'Test' });
      expect(mockApi.setContactProperties).toHaveBeenCalledWith({ role: 'buyer' });
    });

    it('should not throw on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TidioService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const svc = TestBed.inject(TidioService);
      expect(() => svc.identifyUser({ _id: '1', name: 'X', email: 'x@y.com', role: 'buyer' } as any)).not.toThrow();
    });
  });

  describe('identify', () => {
    it('should not throw when API is not available', () => {
      const user = { _id: '1', name: 'Test', email: 'a@b.com', role: 'buyer' } as any;
      const tx = { buyerId: { _id: '1' }, transactionId: 'tx1', platform: 'instagram', totalToPay: 100, status: 'pending' } as any;
      expect(() => service.identify(user, tx)).not.toThrow();
    });

    it('should identify buyer correctly when API is available', () => {
      const mockApi = { setVisitorData: jest.fn(), setContactProperties: jest.fn() };
      (window as any).tidioChatApi = mockApi;
      const user = { _id: '1', name: 'Buyer', email: 'b@b.com', role: 'buyer' } as any;
      const tx = { buyerId: { _id: '1' }, transactionId: 'tx1', platform: 'instagram', totalToPay: 100, status: 'pending' } as any;
      service.identify(user, tx);
      expect(mockApi.setContactProperties).toHaveBeenCalledWith(expect.objectContaining({ role: 'buyer' }));
    });

    it('should identify seller correctly when API is available', () => {
      const mockApi = { setVisitorData: jest.fn(), setContactProperties: jest.fn() };
      (window as any).tidioChatApi = mockApi;
      const user = { _id: '2', name: 'Seller', email: 's@s.com', role: 'seller' } as any;
      const tx = { buyerId: { _id: '1' }, transactionId: 'tx1', platform: 'tiktok', totalToPay: 200, status: 'pending' } as any;
      service.identify(user, tx);
      expect(mockApi.setContactProperties).toHaveBeenCalledWith(expect.objectContaining({ role: 'seller' }));
    });

    it('should treat buyer role when buyerId is a string', () => {
      const mockApi = { setVisitorData: jest.fn(), setContactProperties: jest.fn() };
      (window as any).tidioChatApi = mockApi;
      const user = { _id: '1', name: 'Test', email: 'a@b.com', role: 'buyer' } as any;
      const tx = { buyerId: '1', transactionId: 'tx1', platform: 'instagram', totalToPay: 50, status: 'pending' } as any;
      service.identify(user, tx);
      expect(mockApi.setContactProperties).toHaveBeenCalledWith(expect.objectContaining({ role: 'seller' }));
    });

    it('should not throw on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TidioService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const svc = TestBed.inject(TidioService);
      expect(() => svc.identify({} as any, {} as any)).not.toThrow();
    });
  });

  describe('show', () => {
    it('should warn when API is not available', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      service.show();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not available'));
      consoleSpy.mockRestore();
    });

    it('should call show and open when API is available', () => {
      jest.useFakeTimers();
      const mockApi = { show: jest.fn(), open: jest.fn() };
      (window as any).tidioChatApi = mockApi;
      service.show();
      expect(mockApi.show).toHaveBeenCalled();
      jest.advanceTimersByTime(300);
      expect(mockApi.open).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should not throw on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TidioService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const svc = TestBed.inject(TidioService);
      expect(() => svc.show()).not.toThrow();
    });
  });

  describe('hide', () => {
    it('should call close and hide when API is available', () => {
      const mockApi = { close: jest.fn(), hide: jest.fn() };
      (window as any).tidioChatApi = mockApi;
      service.hide();
      expect(mockApi.close).toHaveBeenCalled();
      expect(mockApi.hide).toHaveBeenCalled();
    });

    it('should not throw when API is not available', () => {
      expect(() => service.hide()).not.toThrow();
    });

    it('should not throw on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TidioService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const svc = TestBed.inject(TidioService);
      expect(() => svc.hide()).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should not throw', () => {
      expect(() => service.destroy()).not.toThrow();
    });

    it('should not throw on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [TidioService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const svc = TestBed.inject(TidioService);
      expect(() => svc.destroy()).not.toThrow();
    });
  });
});
