import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { DocumentRecord } from '../models/payment.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  upload(
    transactionId: string,
    file: File,
    type: 'id' | 'proof' | 'contract' = 'proof'
  ): Observable<ApiResponse<{ document: DocumentRecord }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    return this.http.post<ApiResponse<{ document: DocumentRecord }>>(
      `${this.apiUrl}/${transactionId}`,
      formData
    );
  }

  getByTransaction(transactionId: string): Observable<ApiResponse<{ documents: DocumentRecord[] }>> {
    return this.http.get<ApiResponse<{ documents: DocumentRecord[] }>>(
      `${this.apiUrl}/${transactionId}`
    );
  }
}
