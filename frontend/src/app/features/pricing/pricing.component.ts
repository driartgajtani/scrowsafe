import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AuthService } from '../../core/services/auth.service';

interface PlatformFee {
  platform: string;
  icon: string;
  feePercent: number;
  minFee: number;
}

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatTableModule],
  template: `
    <div class="pricing-page">
      <div class="page-header">
        <h1>Simple, Transparent Pricing</h1>
        <p>No hidden fees. You only pay a small escrow fee when a deal is completed.</p>
      </div>

      <!-- How fees work -->
      <div class="info-cards">
        <mat-card class="info-card">
          <mat-icon class="info-icon blue">percent</mat-icon>
          <h3>Percentage-Based</h3>
          <p>A small percentage of the transaction amount, varying by platform.</p>
        </mat-card>
        <mat-card class="info-card">
          <mat-icon class="info-icon green">money_off</mat-icon>
          <h3>Minimum Fee</h3>
          <p>Each platform has a minimum fee to cover operational costs.</p>
        </mat-card>
        <mat-card class="info-card">
          <mat-icon class="info-icon purple">replay</mat-icon>
          <h3>Full Refunds</h3>
          <p>If a deal falls through, your funds are returned — no fees charged.</p>
        </mat-card>
      </div>

      <!-- Fee table -->
      <mat-card class="fee-table-card">
        <h2>Fees by Platform</h2>
        <table mat-table [dataSource]="fees" class="fee-table">
          <ng-container matColumnDef="platform">
            <th mat-header-cell *matHeaderCellDef>Platform</th>
            <td mat-cell *matCellDef="let row">
              <div class="platform-cell">
                <mat-icon>{{ row.icon }}</mat-icon>
                <span>{{ row.platform }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="feePercent">
            <th mat-header-cell *matHeaderCellDef>Escrow Fee</th>
            <td mat-cell *matCellDef="let row">{{ row.feePercent }}%</td>
          </ng-container>

          <ng-container matColumnDef="minFee">
            <th mat-header-cell *matHeaderCellDef>Minimum Fee</th>
            <td mat-cell *matCellDef="let row">\${{ row.minFee }}</td>
          </ng-container>

          <ng-container matColumnDef="example">
            <th mat-header-cell *matHeaderCellDef>Example (\$1,000 deal)</th>
            <td mat-cell *matCellDef="let row">
              \${{ getExampleFee(row) }}
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </mat-card>

      <!-- Payment methods -->
      <section class="section">
        <h2>Accepted Payment Methods</h2>
        <div class="methods-grid">
          <mat-card class="method-card">
            <mat-icon>credit_card</mat-icon>
            <h3>Card (Stripe)</h3>
            <p>Visa, Mastercard, AMEX — instant processing.</p>
          </mat-card>
          <mat-card class="method-card">
            <mat-icon>account_balance</mat-icon>
            <h3>Wire Transfer</h3>
            <p>Bank-to-bank for larger transactions.</p>
          </mat-card>
          <mat-card class="method-card">
            <mat-icon>currency_bitcoin</mat-icon>
            <h3>Cryptocurrency</h3>
            <p>ETH, BTC, USDT, SOL, and 10+ networks.</p>
          </mat-card>
        </div>
      </section>

      <!-- CTA -->
      <section class="cta">
        <h2>Ready to get started?</h2>
        @if (!auth.isAuthenticated()) {
          <a mat-flat-button color="primary" routerLink="/register" class="big-btn">Create Free Account</a>
        } @else {
          <a mat-flat-button color="primary" routerLink="/transactions/create" class="big-btn">
            <mat-icon>add</mat-icon> Start a Transaction
          </a>
        }
      </section>
    </div>
  `,
  styles: [`
    .pricing-page { max-width: 900px; margin: 0 auto; }
    .page-header {
      text-align: center;
      margin-bottom: 40px;
      h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
      p { color: rgba(0,0,0,0.54); font-size: 16px; margin: 0; }
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 40px;
    }
    .info-card {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      padding: 28px 20px;
      text-align: center;
      h3 { margin: 14px 0 6px; font-size: 16px; font-weight: 600; }
      p { font-size: 13px; color: rgba(0,0,0,0.6); margin: 0; line-height: 1.5; }
    }
    .info-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      padding: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      &.blue { background: #e8eaf6; color: #3f51b5; }
      &.green { background: #e8f5e9; color: #2e7d32; }
      &.purple { background: #ede7f6; color: #6c63ff; }
    }

    .fee-table-card {
      padding: 28px;
      margin-bottom: 48px;
      h2 { margin: 0 0 20px; font-size: 20px; font-weight: 700; }
    }
    .fee-table { width: 100%; }
    .platform-cell {
      display: flex;
      align-items: center;
      gap: 10px;
      mat-icon { color: #6c63ff; font-size: 20px; width: 20px; height: 20px; }
      span { font-weight: 500; }
    }

    .section {
      text-align: center;
      margin-bottom: 48px;
      h2 { font-size: 22px; font-weight: 700; margin: 0 0 24px; }
    }
    .methods-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .method-card {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      padding: 28px 20px;
      text-align: center;
      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #6c63ff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      h3 { margin: 14px 0 6px; font-size: 15px; font-weight: 600; }
      p { font-size: 13px; color: rgba(0,0,0,0.6); margin: 0; }
    }

    .cta {
      text-align: center;
      background: #f5f5f7;
      padding: 48px 24px;
      border-radius: 16px;
      margin-bottom: 24px;
      h2 { font-size: 24px; font-weight: 700; margin: 0 0 20px; }
    }
    .big-btn {
      height: 48px;
      padding: 0 28px !important;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px !important;
    }

    @media (max-width: 768px) {
      .info-cards, .methods-grid { grid-template-columns: 1fr; }
      .page-header h1 { font-size: 24px; }
      .fee-table-card { padding: 16px; overflow-x: auto; }
      :host ::ng-deep table.mat-mdc-table { min-width: 480px; }
    }
  `],
})
export class PricingComponent {
  readonly displayedColumns = ['platform', 'feePercent', 'minFee', 'example'];

  readonly fees: PlatformFee[] = [
    { platform: 'Instagram', icon: 'photo_camera', feePercent: 5, minFee: 25 },
    { platform: 'TikTok', icon: 'music_video', feePercent: 5, minFee: 25 },
    { platform: 'YouTube', icon: 'play_circle', feePercent: 6, minFee: 50 },
    { platform: 'Facebook', icon: 'facebook', feePercent: 5, minFee: 25 },
    { platform: 'Twitter / X', icon: 'tag', feePercent: 5, minFee: 25 },
    { platform: 'Snapchat', icon: 'chat_bubble', feePercent: 5, minFee: 20 },
    { platform: 'Spotify', icon: 'headphones', feePercent: 4, minFee: 15 },
    { platform: 'Gaming', icon: 'sports_esports', feePercent: 7, minFee: 30 },
  ];

  constructor(public auth: AuthService) {}

  getExampleFee(row: PlatformFee): string {
    const calculated = 1000 * (row.feePercent / 100);
    return Math.max(calculated, row.minFee).toFixed(0);
  }
}
