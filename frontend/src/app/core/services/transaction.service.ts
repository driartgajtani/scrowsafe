import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginationMeta } from '../models/api-response.model';
import {
  Transaction,
  FeeCalculation,
  CreateTransactionRequest,
  SubmitCredentialsRequest,
  TransactionStatus,
  Platform,
} from '../models/transaction.model';

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: PaginationMeta;
}

export interface TransactionListQuery {
  page?: number;
  limit?: number;
  status?: TransactionStatus;
  platform?: Platform;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly apiUrl = `${environment.apiUrl}/transactions`;

  constructor(private http: HttpClient) {}

  calculateFee(platform: string, amount: number): Observable<ApiResponse<FeeCalculation>> {
    return this.http.post<ApiResponse<FeeCalculation>>(`${this.apiUrl}/fee-calculate`, {
      platform,
      amount,
    });
  }

  create(data: CreateTransactionRequest): Observable<ApiResponse<{ transaction: Transaction }>> {
    return this.http.post<ApiResponse<{ transaction: Transaction }>>(this.apiUrl, data);
  }

  list(query: TransactionListQuery = {}): Observable<ApiResponse<TransactionListResponse>> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.status) params = params.set('status', query.status);
    if (query.platform) params = params.set('platform', query.platform);
    if (query.sort) params = params.set('sort', query.sort);
    return this.http.get<ApiResponse<TransactionListResponse>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<ApiResponse<{ transaction: Transaction }>> {
    return this.http.get<ApiResponse<{ transaction: Transaction }>>(`${this.apiUrl}/${id}`);
  }

  submitCredentials(
    transactionId: string,
    data: SubmitCredentialsRequest
  ): Observable<ApiResponse<{ transaction: Transaction }>> {
    return this.http.post<ApiResponse<{ transaction: Transaction }>>(
      `${this.apiUrl}/${transactionId}/credentials`,
      data
    );
  }
}
