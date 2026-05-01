import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { environment } from '../../../environments/environment';

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue(null),
}));

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/payments`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PaymentService],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => { expect(service).toBeTruthy(); });

  it('getStripe should return stripe promise', async () => {
    const stripe = await service.getStripe();
    expect(stripe).toBeNull(); // mocked
  });

  it('createPaymentIntent should POST', () => {
    service.createPaymentIntent('txn1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/create-intent/txn1`);
    expect(req.request.method).toBe('POST');
    req.flush({ success: true, data: { clientSecret: 'cs', paymentIntentId: 'pi', amount: 100 } });
  });

  it('confirmPayment should POST', () => {
    service.confirmPayment('pi_test').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/confirm`);
    expect(req.request.body).toEqual({ paymentIntentId: 'pi_test' });
    req.flush({ success: true, data: { transaction: {}, paymentRecord: {} } });
  });

  it('submitWirePayment should POST', () => {
    service.submitWirePayment('txn1', 'REF123').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/wire`);
    expect(req.request.body).toEqual({ transactionId: 'txn1', referenceNumber: 'REF123' });
    req.flush({ success: true, data: null });
  });

  it('submitCryptoPayment should POST', () => {
    service.submitCryptoPayment('txn1', '0xabc', 'bitcoin').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/crypto`);
    expect(req.request.body).toEqual({ transactionId: 'txn1', txHash: '0xabc', network: 'bitcoin' });
    req.flush({ success: true, data: null });
  });
});
