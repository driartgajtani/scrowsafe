import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { Transaction } from '../../../core/models/transaction.model';
import { PaginationMeta } from '../../../core/models/api-response.model';
import { StatusLabelPipe } from '../../../shared/pipes/status.pipe';

@Component({
  selector: 'app-admin-transactions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    StatusLabelPipe,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <button mat-icon-button routerLink="/admin">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Transaction Management</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <mat-card>
          <table mat-table [dataSource]="transactions()" class="full-width">
            <ng-container matColumnDef="transactionId">
              <th mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let tx">
                <a [routerLink]="['/admin/transactions', tx._id]" class="tx-link">
                  {{ tx.transactionId }}
                </a>
              </td>
            </ng-container>

            <ng-container matColumnDef="platform">
              <th mat-header-cell *matHeaderCellDef>Platform</th>
              <td mat-cell *matCellDef="let tx">{{ tx.platform | titlecase }}</td>
            </ng-container>

            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let tx">\${{ tx.amount.toLocaleString() }}</td>
            </ng-container>

            <ng-container matColumnDef="escrowFee">
              <th mat-header-cell *matHeaderCellDef>Fee</th>
              <td mat-cell *matCellDef="let tx">\${{ tx.escrowFee.toLocaleString() }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let tx">
                <span class="status-chip status-{{ tx.status }}">
                  {{ tx.status | statusLabel }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let tx">{{ tx.createdAt | date:'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let tx">
                <a mat-icon-button [routerLink]="['/admin/transactions', tx._id]">
                  <mat-icon>visibility</mat-icon>
                </a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <mat-paginator
            [length]="pagination()?.total || 0"
            [pageSize]="pagination()?.limit || 10"
            [pageIndex]="(pagination()?.page || 1) - 1"
            [pageSizeOptions]="[10, 25, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons>
          </mat-paginator>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1100px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 24px; font-weight: 700; }
    }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .full-width { width: 100%; }
    .tx-link {
      color: #6c63ff;
      text-decoration: none;
      font-family: monospace;
      font-weight: 600;
      &:hover { text-decoration: underline; }
    }
    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pending { background: #fff3e0; color: #e65100; }
    .status-payment_received { background: #e3f2fd; color: #1565c0; }
    .status-credentials_received { background: #e8f5e9; color: #2e7d32; }
    .status-takeover_in_progress { background: #ede7f6; color: #4527a0; }
    .status-completed { background: #e8f5e9; color: #1b5e20; }
    .status-refunded { background: #fce4ec; color: #b71c1c; }
    .status-disputed { background: #fbe9e7; color: #bf360c; }

    @media (max-width: 768px) {
      :host ::ng-deep mat-card { overflow-x: auto; }
      :host ::ng-deep table.mat-mdc-table { min-width: 700px; }
    }
  `],
})
export class AdminTransactionsComponent implements OnInit {
  loading = signal(true);
  transactions = signal<Transaction[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  displayedColumns = ['transactionId', 'platform', 'amount', 'escrowFee', 'status', 'createdAt', 'actions'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  onPageChange(event: PageEvent): void {
    this.loadTransactions(event.pageIndex + 1, event.pageSize);
  }

  private loadTransactions(page = 1, limit = 10): void {
    this.loading.set(true);
    this.adminService.getTransactions(page, limit).subscribe({
      next: (res) => {
        this.transactions.set(res.data.transactions);
        this.pagination.set(res.data.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
