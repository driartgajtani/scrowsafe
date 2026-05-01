import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { CreatePaymentIntentResponse, PaymentRecord } from '../models/payment.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly apiUrl = `${environment.apiUrl}/payments`;
  private stripePromise: Promise<Stripe | null>;

  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(environment.stripePublishableKey);
  }

  getStripe(): Promise<Stripe | null> {
    return this.stripePromise;
  }

  createPaymentIntent(
    transactionId: string
  ): Observable<ApiResponse<CreatePaymentIntentResponse>> {
    return this.http.post<ApiResponse<CreatePaymentIntentResponse>>(
      `${this.apiUrl}/create-intent/${transactionId}`,
      {}
    );
  }

  confirmPayment(
    paymentIntentId: string
  ): Observable<ApiResponse<{ transaction: Transaction; paymentRecord: PaymentRecord }>> {
    return this.http.post<ApiResponse<{ transaction: Transaction; paymentRecord: PaymentRecord }>>(
      `${this.apiUrl}/confirm`,
      { paymentIntentId }
    );
  }

  submitWirePayment(
    transactionId: string,
    referenceNumber: string
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/wire`, {
      transactionId,
      referenceNumber,
    });
  }

  submitCryptoPayment(
    transactionId: string,
    txHash: string,
    network: string
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/crypto`, {
      transactionId,
      txHash,
      network,
    });
  }
}
