import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';
import { TransactionService } from '../../core/services/transaction.service';
import { Transaction } from '../../core/models/transaction.model';
import { StatusLabelPipe } from '../../shared/pipes/status.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    StatusLabelPipe,
  ],
  template: `
    <div class="dashboard">
      <div class="welcome-section">
        <div>
          <h1>Welcome, {{ auth.user()?.name }}</h1>
          <p class="subtitle">Here's an overview of your account activity</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/transactions/create">
          <mat-icon>add</mat-icon>
          New Transaction
        </a>
      </div>

      <div class="stats-grid">
        <mat-card class="stat-card">
          <mat-icon class="stat-icon blue">swap_horiz</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ totalTransactions() }}</span>
            <span class="stat-label">Total Transactions</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon orange">hourglass_empty</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ pendingCount() }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon green">check_circle</mat-icon>
          <div class="stat-info">
            <span class="stat-value">{{ completedCount() }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </mat-card>
        <mat-card class="stat-card">
          <mat-icon class="stat-icon purple">account_balance_wallet</mat-icon>
          <div class="stat-info">
            <span class="stat-value">\${{ totalVolume().toLocaleString() }}</span>
            <span class="stat-label">Total Volume</span>
          </div>
        </mat-card>
      </div>

      <div class="recent-section">
        <div class="section-header">
          <h2>Recent Transactions</h2>
          <a mat-button routerLink="/transactions" color="primary">View All</a>
        </div>

        @if (loading()) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
        } @else if (recentTransactions().length === 0) {
          <mat-card class="empty-state">
            <mat-icon>inbox</mat-icon>
            <h3>No transactions yet</h3>
            <p>Start by creating your first secure transaction</p>
            <a mat-flat-button color="primary" routerLink="/transactions/create">
              <mat-icon>add</mat-icon>
              Create Transaction
            </a>
          </mat-card>
        } @else {
          <div class="transaction-list">
            @for (tx of recentTransactions(); track tx._id) {
              <mat-card class="tx-card" [routerLink]="['/transactions', tx._id]">
                <div class="tx-row">
                  <div class="tx-platform">
                    <mat-icon>{{ getPlatformIcon(tx.platform) }}</mat-icon>
                    <div>
                      <strong>{{ tx.platform | titlecase }}</strong>
                      @if (tx.accountUsername) {
                        <small>&#64;{{ tx.accountUsername }}</small>
                      }
                    </div>
                  </div>
                  <div class="tx-amount">\${{ tx.amount.toLocaleString() }}</div>
                  <span class="status-chip status-{{ tx.status }}">
                    {{ tx.status | statusLabel }}
                  </span>
                  <small class="tx-date">{{ tx.createdAt | date:'mediumDate' }}</small>
                  <mat-icon class="chevron">chevron_right</mat-icon>
                </div>
              </mat-card>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard { max-width: 960px; margin: 0 auto; }
    .welcome-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      flex-wrap: wrap;
      gap: 16px;
      h1 { margin: 0; font-size: 28px; font-weight: 700; }
      .subtitle { color: rgba(0,0,0,0.54); margin: 4px 0 0; }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 40px;
    }
    .stat-card {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 16px;
      padding: 20px;
      cursor: default;
    }
    .stat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      padding: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      &.blue { background: #e8eaf6; color: #3f51b5; }
      &.orange { background: #fff3e0; color: #ef6c00; }
      &.green { background: #e8f5e9; color: #2e7d32; }
      &.purple { background: #ede7f6; color: #6c63ff; }
    }
    .stat-info {
      display: flex;
      flex-direction: column;
    }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 13px; color: rgba(0,0,0,0.54); }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h2 { margin: 0; font-size: 20px; }
    }
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      mat-icon { font-size: 48px; width: 48px; height: 48px; color: rgba(0,0,0,0.2); }
      h3 { margin: 12px 0 4px; }
      p { color: rgba(0,0,0,0.54); margin-bottom: 16px; }
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
      padding: 8px;
    }
    .tx-platform {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      mat-icon { color: #6c63ff; }
      small { display: block; color: rgba(0,0,0,0.54); font-size: 12px; }
    }
    .tx-amount {
      font-size: 16px;
      font-weight: 600;
      min-width: 80px;
      text-align: right;
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
    .tx-date { color: rgba(0,0,0,0.54); min-width: 80px; text-align: right; }
    .chevron { color: rgba(0,0,0,0.3); }

    @media (max-width: 768px) {
      .welcome-section {
        flex-direction: column;
        align-items: flex-start;
        h1 { font-size: 22px; }
      }
      .tx-row {
        flex-wrap: wrap;
        gap: 8px;
      }
      .tx-amount { min-width: auto; }
      .tx-date { display: none; }
      .chevron { display: none; }
      .tx-platform { min-width: 0; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  recentTransactions = signal<Transaction[]>([]);
  totalTransactions = signal(0);
  pendingCount = signal(0);
  completedCount = signal(0);
  totalVolume = signal(0);

  private readonly platformIcons: Record<string, string> = {
    instagram: 'photo_camera',
    tiktok: 'music_video',
    youtube: 'play_circle',
    facebook: 'facebook',
    twitter: 'tag',
    snapchat: 'chat_bubble',
    spotify: 'headphones',
    gaming: 'sports_esports',
  };

  constructor(
    public auth: AuthService,
    private transactionService: TransactionService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  getPlatformIcon(platform: string): string {
    return this.platformIcons[platform] || 'language';
  }

  private loadData(): void {
    this.transactionService.list({ limit: 5, sort: '-createdAt' }).subscribe({
      next: (res) => {
        const txns = res.data.transactions;
        this.recentTransactions.set(txns);
        this.totalTransactions.set(res.data.pagination.total);
        this.pendingCount.set(txns.filter((t) => t.status === 'pending').length);
        this.completedCount.set(txns.filter((t) => t.status === 'completed').length);
        this.totalVolume.set(txns.reduce((sum, t) => sum + t.amount, 0));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
