import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../../core/services/admin.service';
import { AdminDashboardStats } from '../../../core/models/payment.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1>Admin Dashboard</h1>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (stats()) {
        <div class="stats-grid">
          <mat-card class="stat-card" routerLink="/admin/users">
            <mat-icon class="stat-icon blue">people</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.totalUsers }}</span>
              <span class="stat-label">Total Users</span>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card>

          <mat-card class="stat-card" routerLink="/admin/transactions">
            <mat-icon class="stat-icon purple">swap_horiz</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.totalTransactions }}</span>
              <span class="stat-label">Total Transactions</span>
            </div>
            <mat-icon class="arrow">chevron_right</mat-icon>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon orange">hourglass_empty</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.pendingTransactions }}</span>
              <span class="stat-label">Pending</span>
            </div>
          </mat-card>

          <mat-card class="stat-card">
            <mat-icon class="stat-icon green">check_circle</mat-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stats()!.completedTransactions }}</span>
              <span class="stat-label">Completed</span>
            </div>
          </mat-card>

          <mat-card class="stat-card wide">
            <mat-icon class="stat-icon teal">account_balance_wallet</mat-icon>
            <div class="stat-info">
              <span class="stat-value">\${{ stats()!.totalRevenue.toLocaleString() }}</span>
              <span class="stat-label">Total Revenue (Fees)</span>
            </div>
          </mat-card>

          <mat-card class="stat-card wide">
            <mat-icon class="stat-icon indigo">trending_up</mat-icon>
            <div class="stat-info">
              <span class="stat-value">\${{ stats()!.totalVolume.toLocaleString() }}</span>
              <span class="stat-label">Total Transaction Volume</span>
            </div>
          </mat-card>
        </div>

        <div class="quick-actions">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <mat-card class="action-card" routerLink="/admin/users">
              <mat-icon>people</mat-icon>
              <strong>Manage Users</strong>
              <small>View and manage all registered users</small>
            </mat-card>
            <mat-card class="action-card" routerLink="/admin/transactions">
              <mat-icon>receipt_long</mat-icon>
              <strong>Manage Transactions</strong>
              <small>Review, release, or refund transactions</small>
            </mat-card>
            <mat-card class="action-card" routerLink="/admin/wallets">
              <mat-icon>account_balance_wallet</mat-icon>
              <strong>Manage Wallets</strong>
              <small>Configure crypto wallet addresses</small>
            </mat-card>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 960px; margin: 0 auto; }
    .page-header {
      margin-bottom: 32px;
      h1 { margin: 0; font-size: 28px; font-weight: 700; }
    }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 40px;
    }
    .stat-card {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 16px;
      padding: 24px;
      cursor: pointer;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      &.wide { grid-column: span 1; }
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
      &.blue { background: #e3f2fd; color: #1565c0; }
      &.purple { background: #ede7f6; color: #6c63ff; }
      &.orange { background: #fff3e0; color: #ef6c00; }
      &.green { background: #e8f5e9; color: #2e7d32; }
      &.teal { background: #e0f2f1; color: #00695c; }
      &.indigo { background: #e8eaf6; color: #283593; }
    }
    .stat-info { flex: 1; display: flex; flex-direction: column; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 13px; color: rgba(0,0,0,0.54); }
    .arrow { color: rgba(0,0,0,0.3); }
    h2 { font-size: 20px; margin-bottom: 16px; }
    .actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .action-card {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      padding: 24px;
      cursor: pointer;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #6c63ff;
        margin-bottom: 14px;
        background: #ede7f6;
        padding: 10px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      strong { display: block; margin-bottom: 4px; font-size: 15px; }
      small { color: rgba(0,0,0,0.54); font-size: 13px; }
    }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; }
      .actions-grid { grid-template-columns: 1fr; }
      .stat-value { font-size: 22px; }
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  stats = signal<AdminDashboardStats | null>(null);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getDashboard().subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
