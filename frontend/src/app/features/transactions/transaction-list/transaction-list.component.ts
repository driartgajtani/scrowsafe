import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { TransactionService, TransactionListQuery } from '../../../core/services/transaction.service';
import { Transaction, TransactionStatus, Platform, PLATFORMS } from '../../../core/models/transaction.model';
import { PaginationMeta } from '../../../core/models/api-response.model';
import { StatusLabelPipe } from '../../../shared/pipes/status.pipe';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    StatusLabelPipe,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>Transactions</h1>
        <a mat-flat-button color="primary" routerLink="/transactions/create">
          <mat-icon>add</mat-icon>
          New Transaction
        </a>
      </div>

      <mat-card class="filter-card">
        <div class="filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (selectionChange)="applyFilters()">
              <mat-option value="">All Statuses</mat-option>
              @for (s of statuses; track s) {
                <mat-option [value]="s">{{ s | statusLabel }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Platform</mat-label>
            <mat-select [(ngModel)]="filterPlatform" (selectionChange)="applyFilters()">
              <mat-option value="">All Platforms</mat-option>
              @for (p of platforms; track p.value) {
                <mat-option [value]="p.value">{{ p.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Sort</mat-label>
            <mat-select [(ngModel)]="sortOrder" (selectionChange)="applyFilters()">
              <mat-option value="-createdAt">Newest First</mat-option>
              <mat-option value="createdAt">Oldest First</mat-option>
              <mat-option value="-amount">Highest Amount</mat-option>
              <mat-option value="amount">Lowest Amount</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (transactions().length === 0) {
        <mat-card class="empty-state">
          <mat-icon>inbox</mat-icon>
          <h3>No transactions found</h3>
          <p>Try adjusting your filters or create a new transaction</p>
        </mat-card>
      } @else {
        <div class="transaction-list">
          @for (tx of transactions(); track tx._id) {
            <mat-card class="tx-card" [routerLink]="['/transactions', tx._id]">
              <div class="tx-row">
                <div class="tx-platform">
                  <div class="platform-icon-wrap">
                    <mat-icon>{{ getPlatformIcon(tx.platform) }}</mat-icon>
                  </div>
                  <div class="tx-info">
                    <strong>{{ tx.platform | titlecase }}</strong>
                    @if (tx.accountUsername) {
                      <small>&#64;{{ tx.accountUsername }}</small>
                    }
                    <small class="tx-id">{{ tx.transactionId }}</small>
                  </div>
                </div>
                <div class="tx-meta">
                  <div class="tx-amount">\${{ tx.amount.toLocaleString() }}</div>
                  <small class="tx-fee">Fee: \${{ tx.escrowFee.toLocaleString() }}</small>
                </div>
                <span class="status-chip status-{{ tx.status }}">
                  {{ tx.status | statusLabel }}
                </span>
                <small class="tx-date">{{ tx.createdAt | date:'mediumDate' }}</small>
                <mat-icon class="chevron">chevron_right</mat-icon>
              </div>
            </mat-card>
          }
        </div>

        <mat-paginator
          [length]="pagination()?.total || 0"
          [pageSize]="pagination()?.limit || 10"
          [pageIndex]="(pagination()?.page || 1) - 1"
          [pageSizeOptions]="[5, 10, 25]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 960px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 28px; font-weight: 700; }
    }
    .filter-card { margin-bottom: 24px; padding: 16px 16px 0; }
    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .filter-field { min-width: 160px; }
    .loading-container { display: flex; justify-content: center; padding: 40px; }
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgba(0,0,0,0.2); }
      h3 { margin: 12px 0 4px; }
      p { color: rgba(0,0,0,0.54); }
    }
    .tx-card {
      margin-bottom: 8px;
      cursor: pointer;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    }
    .tx-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 8px;
    }
    .platform-icon-wrap {
      background: #ede7f6;
      color: #6c63ff;
      border-radius: 10px;
      padding: 8px;
      display: flex;
    }
    .tx-info {
      display: flex;
      flex-direction: column;
      small { color: rgba(0,0,0,0.54); font-size: 12px; }
    }
    .tx-platform { display: flex; align-items: center; gap: 12px; flex: 1; }
    .tx-meta { text-align: right; min-width: 100px; }
    .tx-amount { font-size: 16px; font-weight: 600; }
    .tx-fee { color: rgba(0,0,0,0.4); font-size: 12px; }
    .tx-id { font-family: monospace; font-size: 11px; }
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
    .tx-date { color: rgba(0,0,0,0.54); min-width: 90px; text-align: right; }
    .chevron { color: rgba(0,0,0,0.3); }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
        h1 { font-size: 22px; }
      }
      .filters { flex-direction: column; gap: 0; }
      .filter-field { min-width: 100%; width: 100%; }
      .tx-row { flex-wrap: wrap; gap: 8px; }
      .tx-meta { min-width: auto; }
      .tx-date { display: none; }
      .chevron { display: none; }
    }
  `],
})
export class TransactionListComponent implements OnInit {
  loading = signal(true);
  transactions = signal<Transaction[]>([]);
  pagination = signal<PaginationMeta | null>(null);

  filterStatus = '';
  filterPlatform = '';
  sortOrder = '-createdAt';

  readonly platforms = PLATFORMS;
  readonly statuses: TransactionStatus[] = [
    'pending', 'payment_received', 'credentials_received',
    'takeover_in_progress', 'completed', 'refunded', 'disputed',
  ];

  private readonly platformIcons: Record<string, string> = {
    instagram: 'photo_camera', tiktok: 'music_video', youtube: 'play_circle',
    facebook: 'facebook', twitter: 'tag', snapchat: 'chat_bubble',
    spotify: 'headphones', gaming: 'sports_esports',
  };

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  getPlatformIcon(platform: string): string {
    return this.platformIcons[platform] || 'language';
  }

  applyFilters(): void {
    this.loadTransactions(1);
  }

  onPageChange(event: PageEvent): void {
    this.loadTransactions(event.pageIndex + 1, event.pageSize);
  }

  private loadTransactions(page = 1, limit = 10): void {
    this.loading.set(true);
    const query: TransactionListQuery = { page, limit, sort: this.sortOrder };
    if (this.filterStatus) query.status = this.filterStatus as TransactionStatus;
    if (this.filterPlatform) query.platform = this.filterPlatform as Platform;

    this.transactionService.list(query).subscribe({
      next: (res) => {
        this.transactions.set(res.data.transactions);
        this.pagination.set(res.data.pagination);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
