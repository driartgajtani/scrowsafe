import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface WalletInfo {
  network: string;
  label: string;
  address: string;
  explorer: string;
  enabled: boolean;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly apiUrl = `${environment.apiUrl}/wallets`;

  constructor(private http: HttpClient) {}

  getWallets(): Observable<ApiResponse<{ wallets: WalletInfo[] }>> {
    return this.http.get<ApiResponse<{ wallets: WalletInfo[] }>>(this.apiUrl);
  }
}
