import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { AdminService } from '../../../core/services/admin.service';

interface WalletItem {
  network: string;
  label: string;
  address: string;
  explorer: string;
  enabled: boolean;
  editing?: boolean;
  saving?: boolean;
}

@Component({
  selector: 'app-admin-wallets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
  ],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <button mat-icon-button routerLink="/admin">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Wallet Management</h1>
      </div>

      <p class="subtitle">Manage crypto wallet addresses displayed to buyers during payment.</p>

      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else {
        <div class="wallet-list">
          @for (wallet of wallets(); track wallet.network) {
            <mat-card class="wallet-card" [class.disabled]="!wallet.enabled">
              <div class="wallet-header">
                <div class="wallet-title">
                  <strong>{{ wallet.label }}</strong>
                  <small class="network-tag">{{ wallet.network }}</small>
                </div>
                <mat-slide-toggle
                  [checked]="wallet.enabled"
                  (change)="toggleEnabled(wallet)"
                  color="primary">
                </mat-slide-toggle>
              </div>

              @if (wallet.editing) {
                <div class="wallet-edit">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Wallet Address</mat-label>
                    <input matInput [(ngModel)]="wallet.address">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Block Explorer URL</mat-label>
                    <input matInput [(ngModel)]="wallet.explorer" placeholder="https://etherscan.io/tx/">
                  </mat-form-field>
                  <div class="edit-actions">
                    <button mat-flat-button color="primary" (click)="saveWallet(wallet)"
                            [disabled]="wallet.saving">
                      @if (wallet.saving) {
                        <mat-spinner diameter="18"></mat-spinner>
                      } @else {
                        Save
                      }
                    </button>
                    <button mat-stroked-button (click)="wallet.editing = false">Cancel</button>
                  </div>
                </div>
              } @else {
                <div class="wallet-display">
                  <code class="address">{{ wallet.address }}</code>
                  <button mat-icon-button (click)="wallet.editing = true" matTooltip="Edit">
                    <mat-icon>edit</mat-icon>
                  </button>
                </div>
              }
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 800px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      h1 { margin: 0; font-size: 24px; font-weight: 700; }
    }
    .subtitle { color: rgba(0,0,0,0.54); margin-bottom: 24px; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .wallet-list { display: flex; flex-direction: column; gap: 12px; }
    .wallet-card {
      padding: 20px;
      transition: opacity 0.2s;
      &.disabled { opacity: 0.5; }
    }
    .wallet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .wallet-title {
      display: flex;
      align-items: center;
      gap: 10px;
      strong { font-size: 15px; }
    }
    .network-tag {
      background: #ede7f6;
      color: #6c63ff;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }
    .wallet-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .address {
      flex: 1;
      font-size: 13px;
      word-break: break-all;
      background: #f5f5f7;
      padding: 8px 12px;
      border-radius: 6px;
      color: #1a1a2e;
    }
    .wallet-edit { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .edit-actions { display: flex; gap: 8px; }
  `],
})
export class AdminWalletsComponent implements OnInit {
  loading = signal(true);
  wallets = signal<WalletItem[]>([]);

  constructor(
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadWallets();
  }

  toggleEnabled(wallet: WalletItem): void {
    wallet.enabled = !wallet.enabled;
    this.saveWallet(wallet);
  }

  saveWallet(wallet: WalletItem): void {
    wallet.saving = true;
    this.adminService.updateWallet(wallet.network, {
      label: wallet.label,
      address: wallet.address,
      explorer: wallet.explorer,
      enabled: wallet.enabled,
    }).subscribe({
      next: () => {
        wallet.saving = false;
        wallet.editing = false;
        this.snackBar.open('Wallet updated', 'Close', { duration: 3000 });
      },
      error: (err) => {
        wallet.saving = false;
        this.snackBar.open(err.error?.message || 'Failed to update wallet', 'Close', { duration: 5000 });
      },
    });
  }

  private loadWallets(): void {
    this.adminService.getWallets().subscribe({
      next: (res) => {
        this.wallets.set(res.data.wallets.map((w: any) => ({ ...w, editing: false, saving: false })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
