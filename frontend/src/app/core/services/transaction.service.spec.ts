import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TransactionService } from './transaction.service';
import { environment } from '../../../environments/environment';

describe('TransactionService', () => {
  let service: TransactionService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/transactions`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TransactionService],
    });
    service = TestBed.inject(TransactionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateFee', () => {
    it('should POST fee calculation', () => {
      service.calculateFee('instagram', 500).subscribe(res => {
        expect(res.success).toBe(true);
      });
      const req = httpMock.expectOne(`${apiUrl}/fee-calculate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ platform: 'instagram', amount: 500 });
      req.flush({ success: true, data: { escrowFee: 25, totalToPay: 525 } });
    });
  });

  describe('create', () => {
    it('should POST new transaction', () => {
      const data = { counterpartyEmail: 'a@b.com', platform: 'instagram' as any, amount: 100, role: 'buyer' as any };
      service.create(data).subscribe();
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { transaction: {} } });
    });
  });

  describe('list', () => {
    it('should GET transactions with query params', () => {
      service.list({ page: 2, limit: 10, status: 'pending' }).subscribe();
      const req = httpMock.expectOne(r => r.url === apiUrl && r.params.get('page') === '2');
      expect(req.request.params.get('status')).toBe('pending');
      req.flush({ success: true, data: { transactions: [], pagination: {} } });
    });

    it('should GET with default params', () => {
      service.list().subscribe();
      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { transactions: [], pagination: {} } });
    });

    it('should include platform param', () => {
      service.list({ platform: 'tiktok' as any }).subscribe();
      const req = httpMock.expectOne(r => r.url === apiUrl && r.params.get('platform') === 'tiktok');
      req.flush({ success: true, data: { transactions: [], pagination: {} } });
    });

    it('should include sort param', () => {
      service.list({ sort: '-createdAt' }).subscribe();
      const req = httpMock.expectOne(r => r.url === apiUrl && r.params.get('sort') === '-createdAt');
      req.flush({ success: true, data: { transactions: [], pagination: {} } });
    });
  });

  describe('getById', () => {
    it('should GET transaction by id', () => {
      service.getById('txn1').subscribe();
      const req = httpMock.expectOne(`${apiUrl}/txn1`);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: { transaction: {} } });
    });
  });

  describe('submitCredentials', () => {
    it('should POST credentials', () => {
      service.submitCredentials('txn1', { credentials: 'creds', payoutInfo: 'info' }).subscribe();
      const req = httpMock.expectOne(`${apiUrl}/txn1/credentials`);
      expect(req.request.method).toBe('POST');
      req.flush({ success: true, data: { transaction: {} } });
    });
  });
});
