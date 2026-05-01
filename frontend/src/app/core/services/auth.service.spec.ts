import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    localStorage.clear();
    router = { navigate: jest.fn(), createUrlTree: jest.fn() } as any;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should load user from storage on init', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('scrowsafe_user', JSON.stringify({ _id: '1', name: 'Test', role: 'buyer' }));
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const svc = TestBed.inject(AuthService);
    expect(svc.user()).toBeTruthy();
  });

  it('should clear storage when stored user is invalid JSON', () => {
    TestBed.resetTestingModule();
    localStorage.setItem('scrowsafe_user', 'INVALID_JSON');
    localStorage.setItem('scrowsafe_access_token', 'tok');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    const svc = TestBed.inject(AuthService);
    expect(svc.user()).toBeNull();
    expect(localStorage.getItem('scrowsafe_access_token')).toBeNull();
  });

  it('should return accessToken from localStorage', () => {
    localStorage.setItem('scrowsafe_access_token', 'my-token');
    expect(service.accessToken).toBe('my-token');
  });

  it('should return refreshToken from localStorage', () => {
    localStorage.setItem('scrowsafe_refresh_token', 'my-refresh');
    expect(service.refreshToken).toBe('my-refresh');
  });

  it('should expose isRefreshing$ subject', () => {
    expect(service.isRefreshing$).toBeDefined();
    expect(service.isRefreshing$.value).toBe(false);
  });

  describe('login', () => {
    it('should POST to login and store tokens', () => {
      const mockResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: { _id: '1', name: 'John', email: 'john@test.com', role: 'buyer' },
          accessToken: 'access123',
          refreshToken: 'refresh123',
        },
      };

      service.login({ email: 'john@test.com', password: 'pass123' }).subscribe(res => {
        expect(res.data.accessToken).toBe('access123');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      expect(localStorage.getItem('scrowsafe_access_token')).toBe('access123');
      expect(service.isAuthenticated()).toBe(true);
    });

    it('should propagate login errors via handleError', () => {
      let caughtError: any;
      service.login({ email: 'bad@test.com', password: 'wrong' }).subscribe({
        error: (err) => { caughtError = err; },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({ message: 'Invalid' }, { status: 401, statusText: 'Unauthorized' });
      expect(caughtError).toBeTruthy();
    });

    it('should propagate register errors via handleError', () => {
      let caughtError: any;
      service.register({ name: 'X', email: 'x@y.com', password: 'pass1234', role: 'buyer' }).subscribe({
        error: (err) => { caughtError = err; },
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush({ message: 'Exists' }, { status: 409, statusText: 'Conflict' });
      expect(caughtError).toBeTruthy();
    });
  });

  describe('register', () => {
    it('should POST to register', () => {
      const mockResponse = {
        success: true,
        message: 'Registered',
        data: {
          user: { _id: '1', name: 'John', email: 'john@test.com', role: 'buyer' },
          accessToken: 'acc',
          refreshToken: 'ref',
        },
      };

      service.register({ name: 'John', email: 'john@test.com', password: 'pass123', role: 'buyer' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh and store new tokens', () => {
      localStorage.setItem('scrowsafe_refresh_token', 'old-refresh');
      service.refreshAccessToken().subscribe(res => {
        expect(res.data.accessToken).toBe('new-access');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh-token`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { accessToken: 'new-access', refreshToken: 'new-refresh' } });

      expect(localStorage.getItem('scrowsafe_access_token')).toBe('new-access');
      expect(localStorage.getItem('scrowsafe_refresh_token')).toBe('new-refresh');
      expect(service.isRefreshing$.value).toBe(false);
    });

    it('should logout on refresh failure', () => {
      localStorage.setItem('scrowsafe_refresh_token', 'old-refresh');
      let errorCaught = false;
      service.refreshAccessToken().subscribe({ error: () => { errorCaught = true; } });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/refresh-token`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      expect(errorCaught).toBe(true);
      expect(service.isRefreshing$.value).toBe(false);
      expect(service.user()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('logout', () => {
    it('should clear storage and navigate to login', () => {
      localStorage.setItem('scrowsafe_access_token', 'token');
      localStorage.setItem('scrowsafe_user', '{}');
      service.logout();

      expect(localStorage.getItem('scrowsafe_access_token')).toBeNull();
      expect(service.user()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });

    it('should not POST logout when no token exists', () => {
      service.logout();
      httpMock.expectNone(`${environment.apiUrl}/auth/logout`);
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle logout POST error gracefully', () => {
      localStorage.setItem('scrowsafe_access_token', 'token');
      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({}, { status: 500, statusText: 'Server Error' });

      expect(service.user()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('getProfile', () => {
    it('should GET profile and update user signal', () => {
      const mockRes = { success: true, data: { user: { _id: '1', name: 'John', role: 'buyer' } } };
      service.getProfile().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush(mockRes);
      expect(service.user()?.name).toBe('John');
    });
  });

  describe('updateProfile', () => {
    it('should PUT profile update', () => {
      const mockRes = { success: true, data: { user: { _id: '1', name: 'New Name', role: 'buyer' } } };
      service.updateProfile({ name: 'New Name' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockRes);
      expect(service.user()?.name).toBe('New Name');
    });
  });

  describe('changePassword', () => {
    it('should PUT password change', () => {
      service.changePassword({ currentPassword: 'old', newPassword: 'new123' }).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/change-password`);
      expect(req.request.method).toBe('PUT');
      req.flush({ success: true, data: null });
    });
  });

  describe('forgotPassword', () => {
    it('should POST forgot password', () => {
      service.forgotPassword('test@test.com').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: null });
    });
  });

  describe('resetPassword', () => {
    it('should POST reset password', () => {
      service.resetPassword('token123', 'newpass').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      expect(req.request.body).toEqual({ token: 'token123', password: 'newpass' });
      req.flush({ success: true, data: null });
    });
  });

  describe('verifyEmail', () => {
    it('should GET verify endpoint', () => {
      service.verifyEmail('token123').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/verify/token123`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: null });
    });
  });

  describe('resendVerification', () => {
    it('should POST resend verification', () => {
      service.resendVerification('test@test.com').subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/auth/resend-verification`);
      expect(req.request.body).toEqual({ email: 'test@test.com' });
      req.flush({ success: true, data: null });
    });
  });

  describe('server platform', () => {
    let serverService: AuthService;
    let serverHttpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.resetTestingModule();
      localStorage.setItem('scrowsafe_user', JSON.stringify({ _id: '1', role: 'buyer' }));
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService,
          { provide: Router, useValue: router },
          { provide: PLATFORM_ID, useValue: 'server' },
        ],
      });
      serverService = TestBed.inject(AuthService);
      serverHttpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => serverHttpMock.verify());

    it('should not load user from storage on server', () => {
      expect(serverService.user()).toBeNull();
      expect(serverService.accessToken).toBeNull();
      expect(serverService.refreshToken).toBeNull();
    });

    it('should login but not store tokens on server', () => {
      serverService.login({ email: 'a@b.com', password: 'pass' }).subscribe();
      const req = serverHttpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({
        success: true,
        data: { user: { _id: '1', role: 'buyer' }, accessToken: 'at', refreshToken: 'rt' },
      });
      expect(serverService.user()).toBeTruthy();
      expect(localStorage.getItem('scrowsafe_access_token')).toBeNull();
    });

    it('should refreshAccessToken but not store tokens on server', () => {
      serverService.refreshAccessToken().subscribe();
      const req = serverHttpMock.expectOne(`${environment.apiUrl}/auth/refresh-token`);
      req.flush({ success: true, data: { accessToken: 'new-at', refreshToken: 'new-rt' } });
      expect(serverService.isRefreshing$.value).toBe(false);
    });

    it('should getProfile but not store in localStorage on server', () => {
      serverService.getProfile().subscribe();
      const req = serverHttpMock.expectOne(`${environment.apiUrl}/auth/me`);
      req.flush({ success: true, data: { user: { _id: '1', name: 'John', role: 'buyer' } } });
      expect(serverService.user()?.name).toBe('John');
    });

    it('should updateProfile but not store in localStorage on server', () => {
      serverService.updateProfile({ name: 'New' }).subscribe();
      const req = serverHttpMock.expectOne(`${environment.apiUrl}/auth/profile`);
      req.flush({ success: true, data: { user: { _id: '1', name: 'New', role: 'buyer' } } });
      expect(serverService.user()?.name).toBe('New');
    });

    it('should clearStorage without error on server', () => {
      serverService.logout();
      expect(serverService.user()).toBeNull();
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      TestBed.resetTestingModule();
      localStorage.setItem('scrowsafe_user', JSON.stringify({ _id: '1', role: 'admin' }));
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          AuthService,
          { provide: Router, useValue: router },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      const svc = TestBed.inject(AuthService);
      expect(svc.isAdmin()).toBe(true);
    });
  });
});
