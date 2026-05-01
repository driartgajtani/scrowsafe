import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/admin`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('getDashboard should GET dashboard', () => {
    service.getDashboard().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/dashboard`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('getUsers should GET users with params', () => {
    service.getUsers(1, 10, 'admin').subscribe();
    const req = httpMock.expectOne(r => r.url === `${apiUrl}/users`);
    expect(req.request.params.get('role')).toBe('admin');
    req.flush({ success: true, data: { users: [], pagination: {} } });
  });

  it('getUsers should work without role', () => {
    service.getUsers().subscribe();
    const req = httpMock.expectOne(r => r.url === `${apiUrl}/users`);
    expect(req.request.params.has('role')).toBe(false);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ success: true, data: { users: [], pagination: {} } });
  });

  it('getTransactions should work with defaults', () => {
    service.getTransactions().subscribe();
    const req = httpMock.expectOne(r => r.url === `${apiUrl}/transactions`);
    expect(req.request.params.get('page')).toBe('1');
    expect(req.request.params.get('limit')).toBe('10');
    req.flush({ success: true, data: { transactions: [], pagination: {} } });
  });

  it('getTransactions should GET transactions', () => {
    service.getTransactions(2, 20).subscribe();
    const req = httpMock.expectOne(r => r.url === `${apiUrl}/transactions`);
    expect(req.request.params.get('page')).toBe('2');
    req.flush({ success: true, data: { transactions: [], pagination: {} } });
  });

  it('getTransactionDetail should GET by id', () => {
    service.getTransactionDetail('txn1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/transactions/txn1`);
    req.flush({ success: true, data: { transaction: {}, payments: [], documents: [] } });
  });

  it('updateTransactionStatus should PUT status', () => {
    service.updateTransactionStatus('txn1', 'completed' as any, 'note').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/transactions/txn1/status`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.status).toBe('completed');
    req.flush({ success: true, data: { transaction: {} } });
  });

  it('releaseFunds should POST release', () => {
    service.releaseFunds('txn1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/transactions/txn1/release`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { paymentRecord: {} } });
  });

  it('refundTransaction should POST refund', () => {
    service.refundTransaction('txn1', 'bad deal').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/transactions/txn1/refund`);
    expect(req.request.body.reason).toBe('bad deal');
    req.flush({ success: true, data: { transaction: {}, paymentRecord: {} } });
  });

  it('getWallets should GET wallets', () => {
    service.getWallets().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/wallets`);
    req.flush({ success: true, data: { wallets: [] } });
  });

  it('updateWallet should PUT wallet', () => {
    service.updateWallet('bitcoin', { label: 'BTC', address: 'bc1...', explorer: 'https://', enabled: true }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/wallets/bitcoin`);
    expect(req.request.method).toBe('PUT');
    req.flush({ success: true, data: { wallet: {} } });
  });

  it('deleteWallet should DELETE wallet', () => {
    service.deleteWallet('bitcoin').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/wallets/bitcoin`);
    expect(req.request.method).toBe('DELETE');
    req.flush({ success: true, data: null });
  });
});
