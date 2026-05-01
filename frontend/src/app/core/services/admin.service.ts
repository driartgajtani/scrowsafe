import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, PaginationMeta } from '../models/api-response.model';
import { User } from '../models/user.model';
import { Transaction, TransactionStatus } from '../models/transaction.model';
import { AdminDashboardStats, PaymentRecord, DocumentRecord } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<AdminDashboardStats>> {
    return this.http.get<ApiResponse<AdminDashboardStats>>(`${this.apiUrl}/dashboard`);
  }

  getUsers(
    page = 1,
    limit = 10,
    role?: string
  ): Observable<ApiResponse<{ users: User[]; pagination: PaginationMeta }>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    if (role) params = params.set('role', role);
    return this.http.get<ApiResponse<{ users: User[]; pagination: PaginationMeta }>>(
      `${this.apiUrl}/users`,
      { params }
    );
  }

  getTransactions(
    page = 1,
    limit = 10
  ): Observable<ApiResponse<{ transactions: Transaction[]; pagination: PaginationMeta }>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ApiResponse<{ transactions: Transaction[]; pagination: PaginationMeta }>>(
      `${this.apiUrl}/transactions`,
      { params }
    );
  }

  getTransactionDetail(
    id: string
  ): Observable<
    ApiResponse<{ transaction: Transaction; payments: PaymentRecord[]; documents: DocumentRecord[] }>
  > {
    return this.http.get<
      ApiResponse<{ transaction: Transaction; payments: PaymentRecord[]; documents: DocumentRecord[] }>
    >(`${this.apiUrl}/transactions/${id}`);
  }

  updateTransactionStatus(
    id: string,
    status: TransactionStatus,
    adminNotes?: string,
    refundReason?: string
  ): Observable<ApiResponse<{ transaction: Transaction }>> {
    return this.http.put<ApiResponse<{ transaction: Transaction }>>(
      `${this.apiUrl}/transactions/${id}/status`,
      { status, adminNotes, refundReason }
    );
  }

  releaseFunds(id: string): Observable<ApiResponse<{ paymentRecord: PaymentRecord }>> {
    return this.http.post<ApiResponse<{ paymentRecord: PaymentRecord }>>(
      `${this.apiUrl}/transactions/${id}/release`,
      {}
    );
  }

  refundTransaction(
    id: string,
    reason?: string
  ): Observable<ApiResponse<{ transaction: Transaction; paymentRecord: PaymentRecord }>> {
    return this.http.post<ApiResponse<{ transaction: Transaction; paymentRecord: PaymentRecord }>>(
      `${this.apiUrl}/transactions/${id}/refund`,
      { reason }
    );
  }

  getWallets(): Observable<ApiResponse<{ wallets: any[] }>> {
    return this.http.get<ApiResponse<{ wallets: any[] }>>(`${this.apiUrl}/wallets`);
  }

  updateWallet(
    network: string,
    data: { label: string; address: string; explorer: string; enabled: boolean }
  ): Observable<ApiResponse<{ wallet: any }>> {
    return this.http.put<ApiResponse<{ wallet: any }>>(
      `${this.apiUrl}/wallets/${network}`,
      data
    );
  }

  deleteWallet(network: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.apiUrl}/wallets/${network}`);
  }
}
