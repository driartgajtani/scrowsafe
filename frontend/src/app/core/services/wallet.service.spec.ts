import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { WalletService } from './wallet.service';
import { environment } from '../../../environments/environment';

describe('WalletService', () => {
  let service: WalletService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/wallets`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), WalletService],
    });
    service = TestBed.inject(WalletService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('getWallets should GET wallets', () => {
    service.getWallets().subscribe(res => {
      expect(res.data.wallets).toEqual([]);
    });
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { wallets: [] } });
  });
});
