import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AdminService } from '../../../core/services/admin.service';
import { Transaction, TransactionStatus } from '../../../core/models/transaction.model';
import { PaymentRecord, DocumentRecord } from '../../../core/models/payment.model';
import { StatusLabelPipe } from '../../../shared/pipes/status.pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTabsModule,
    StatusLabelPipe,
  ],
  template: `
    <div class="admin-page">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (tx()) {
        <div class="page-header">
          <button mat-icon-button routerLink="/admin/transactions">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ tx()!.transactionId }}</h1>
            <span class="status-chip status-{{ tx()!.status }}">
              {{ tx()!.status | statusLabel }}
            </span>
          </div>
        </div>

        <mat-tab-group>
          <!-- Details Tab -->
          <mat-tab label="Details">
            <div class="tab-content">
              <div class="detail-grid">
                <mat-card class="info-card">
                  <h3>Transaction Info</h3>
                  <div class="info-grid">
                    <div class="info-item">
                      <small>Platform</small>
                      <strong>{{ tx()!.platform | titlecase }}</strong>
                    </div>
                    @if (tx()!.accountUsername) {
                      <div class="info-item">
                        <small>Username</small>
                        <strong>&#64;{{ tx()!.accountUsername }}</strong>
                      </div>
                    }
                    <div class="info-item">
                      <small>Amount</small>
                      <strong>\${{ tx()!.amount.toLocaleString() }}</strong>
                    </div>
                    <div class="info-item">
                      <small>Escrow Fee</small>
                      <strong>\${{ tx()!.escrowFee.toLocaleString() }}</strong>
                    </div>
                    <div class="info-item">
                      <small>Total</small>
                      <strong>\${{ tx()!.totalToPay.toLocaleString() }}</strong>
                    </div>
                    <div class="info-item">
                      <small>Payment Method</small>
                      <strong>{{ tx()!.paymentMethod || 'N/A' | titlecase }}</strong>
                    </div>
                    <div class="info-item">
                      <small>Progress Step</small>
                      <strong>{{ tx()!.progressStep }} / 4</strong>
                    </div>
                    <div class="info-item">
                      <small>Created</small>
                      <strong>{{ tx()!.createdAt | date:'medium' }}</strong>
                    </div>
                  </div>

                  @if (tx()!.accountDescription) {
                    <mat-divider></mat-divider>
                    <div class="description">
                      <small>Description</small>
                      <p>{{ tx()!.accountDescription }}</p>
                    </div>
                  }

                  @if (tx()!.adminNotes) {
                    <mat-divider></mat-divider>
                    <div class="description">
                      <small>Admin Notes</small>
                      <p>{{ tx()!.adminNotes }}</p>
                    </div>
                  }
                </mat-card>

                <mat-card class="info-card">
                  <h3>Parties</h3>
                  <div class="party">
                    <mat-icon>shopping_cart</mat-icon>
                    <div>
                      <small>Buyer</small>
                      <strong>{{ getBuyerName() }}</strong>
                      <span class="email">{{ getBuyerEmail() }}</span>
                    </div>
                  </div>
                  <mat-divider></mat-divider>
                  <div class="party">
                    <mat-icon>storefront</mat-icon>
                    <div>
                      <small>Seller</small>
                      <strong>{{ getSellerName() }}</strong>
                      <span class="email">{{ getSellerEmail() }}</span>
                    </div>
                  </div>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Admin Actions Tab -->
          <mat-tab label="Actions">
            <div class="tab-content">
              <div class="actions-grid">
                <!-- Status Update -->
                <mat-card class="action-card">
                  <h3>
                    <mat-icon>update</mat-icon>
                    Update Status
                  </h3>
                  <form [formGroup]="statusForm" (ngSubmit)="updateStatus()">
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>New Status</mat-label>
                      <mat-select formControlName="status">
                        @for (s of allStatuses; track s) {
                          <mat-option [value]="s">{{ s | statusLabel }}</mat-option>
                        }
                      </mat-select>
                    </mat-form-field>
                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Admin Notes</mat-label>
                      <textarea matInput formControlName="adminNotes" rows="2"></textarea>
                    </mat-form-field>
                    <button mat-flat-button color="primary" type="submit" [disabled]="actionLoading()">
                      Update Status
                    </button>
                  </form>
                </mat-card>

                <!-- Release / Refund -->
                <mat-card class="action-card">
                  <h3>
                    <mat-icon>account_balance</mat-icon>
                    Fund Actions
                  </h3>

                  <div class="fund-actions">
                    <button mat-flat-button color="primary"
                            (click)="releaseFunds()" [disabled]="actionLoading()"
                            class="full-width">
                      @if (actionLoading()) {
                        <mat-spinner diameter="20"></mat-spinner>
                      } @else {
                        <ng-container>
                          <mat-icon>check_circle</mat-icon>
                          Release Funds to Seller
                        </ng-container>
                      }
                    </button>

                    <mat-divider></mat-divider>

                    <mat-form-field appearance="outline" class="full-width">
                      <mat-label>Refund Reason</mat-label>
                      <textarea matInput [(ngModel)]="refundReason" rows="2"></textarea>
                    </mat-form-field>
                    <button mat-stroked-button color="warn"
                            (click)="refundTransaction()" [disabled]="actionLoading()"
                            class="full-width">
                      <mat-icon>undo</mat-icon>
                      Refund to Buyer
                    </button>
                  </div>
                </mat-card>
              </div>
            </div>
          </mat-tab>

          <!-- Payments Tab -->
          <mat-tab label="Payments ({{ payments().length }})">
            <div class="tab-content">
              @if (payments().length === 0) {
                <mat-card class="empty-state">
                  <mat-icon>payment</mat-icon>
                  <p>No payment records yet</p>
                </mat-card>
              } @else {
                @for (payment of payments(); track payment._id) {
                  <mat-card class="payment-card">
                    <div class="payment-row">
                      <div>
                        <strong>{{ payment.method | titlecase }}</strong>
                        <small>{{ payment.createdAt | date:'medium' }}</small>
                      </div>
                      <div class="payment-amount">\${{ payment.amount.toLocaleString() }}</div>
                      <span class="status-chip status-{{ payment.status }}">
                        {{ payment.status | titlecase }}
                      </span>
                    </div>
                    @if (payment.stripePaymentIntentId) {
                      <small class="mono">Stripe PI: {{ payment.stripePaymentIntentId }}</small>
                    }
                    @if (payment.providerTxId) {
                      <small class="mono">Provider TX: {{ payment.providerTxId }}</small>
                    }
                  </mat-card>
                }
              }
            </div>
          </mat-tab>

          <!-- Documents Tab -->
          <mat-tab label="Documents ({{ documents().length }})">
            <div class="tab-content">
              @if (documents().length === 0) {
                <mat-card class="empty-state">
                  <mat-icon>folder_open</mat-icon>
                  <p>No documents uploaded</p>
                </mat-card>
              } @else {
                @for (doc of documents(); track doc._id) {
                  <mat-card class="doc-card">
                    <div class="doc-row">
                      <mat-icon>description</mat-icon>
                      <div class="doc-info">
                        <strong>{{ doc.originalName }}</strong>
                        <small>
                          {{ doc.type | titlecase }} &middot;
                          {{ formatFileSize(doc.fileSize) }} &middot;
                          {{ doc.createdAt | date:'medium' }}
                        </small>
                      </div>
                      <a mat-icon-button [href]="getDocumentUrl(doc)" target="_blank">
                        <mat-icon>download</mat-icon>
                      </a>
                    </div>
                  </mat-card>
                }
              }
            </div>
          </mat-tab>
        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1000px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 24px; font-weight: 700; font-family: monospace; }
    }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .tab-content { padding: 24px 0; }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }
    .info-card { padding: 24px; }
    h3 {
      margin: 0 0 16px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      small { color: rgba(0,0,0,0.54); font-size: 12px; }
    }
    .description {
      padding-top: 16px;
      small { color: rgba(0,0,0,0.54); font-size: 12px; }
      p { margin: 4px 0 0; font-size: 14px; }
    }
    .party {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      mat-icon { color: #6c63ff; }
      small { color: rgba(0,0,0,0.54); font-size: 12px; display: block; }
      .email { color: rgba(0,0,0,0.54); font-size: 13px; display: block; }
    }
    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }
    .status-pending, .status-held { background: #fff3e0; color: #e65100; }
    .status-payment_received { background: #e3f2fd; color: #1565c0; }
    .status-credentials_received, .status-released { background: #e8f5e9; color: #2e7d32; }
    .status-takeover_in_progress { background: #ede7f6; color: #4527a0; }
    .status-completed { background: #e8f5e9; color: #1b5e20; }
    .status-refunded, .status-failed { background: #fce4ec; color: #b71c1c; }
    .status-disputed { background: #fbe9e7; color: #bf360c; }
    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .actions-grid { grid-template-columns: 1fr; } }
    .action-card { padding: 24px; }
    .full-width { width: 100%; }
    .fund-actions { display: flex; flex-direction: column; gap: 16px; }
    .payment-card, .doc-card { padding: 16px; margin-bottom: 8px; }
    .payment-row, .doc-row {
      display: flex;
      align-items: center;
      gap: 16px;
      small { display: block; color: rgba(0,0,0,0.54); font-size: 12px; }
    }
    .payment-amount { margin-left: auto; font-size: 18px; font-weight: 600; }
    .doc-info {
      flex: 1;
      strong { display: block; }
    }
    .mono { font-family: monospace; font-size: 12px; color: rgba(0,0,0,0.5); display: block; margin-top: 8px; }
    .empty-state {
      text-align: center;
      padding: 40px;
      mat-icon { font-size: 40px; width: 40px; height: 40px; color: rgba(0,0,0,0.2); }
      p { color: rgba(0,0,0,0.4); }
    }

    @media (max-width: 768px) {
      .page-header h1 { font-size: 16px; }
      .info-grid { grid-template-columns: 1fr; }
      .info-card { padding: 16px; }
      .action-card { padding: 16px; }
      .payment-row { flex-wrap: wrap; gap: 8px; }
      .payment-amount { margin-left: 0; }
    }
  `],
})
export class AdminTransactionDetailComponent implements OnInit {
  loading = signal(true);
  actionLoading = signal(false);
  tx = signal<Transaction | null>(null);
  payments = signal<PaymentRecord[]>([]);
  documents = signal<DocumentRecord[]>([]);
  refundReason = '';

  statusForm: FormGroup;

  readonly allStatuses: TransactionStatus[] = [
    'pending', 'payment_received', 'credentials_received',
    'takeover_in_progress', 'completed', 'refunded', 'disputed',
  ];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private adminService: AdminService,
    private snackBar: MatSnackBar
  ) {
    this.statusForm = this.fb.group({
      status: ['', Validators.required],
      adminNotes: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadDetail(id);
  }

  getBuyerName(): string {
    const b = this.tx()?.buyerId;
    return typeof b === 'object' ? b.name : 'Unknown';
  }

  getBuyerEmail(): string {
    const b = this.tx()?.buyerId;
    return typeof b === 'object' ? b.email : '';
  }

  getSellerName(): string {
    const s = this.tx()?.sellerId;
    return typeof s === 'object' ? s.name : 'Unknown';
  }

  getSellerEmail(): string {
    const s = this.tx()?.sellerId;
    return typeof s === 'object' ? s.email : '';
  }

  updateStatus(): void {
    if (this.statusForm.invalid) return;
    this.actionLoading.set(true);
    const { status, adminNotes } = this.statusForm.value;
    this.adminService.updateTransactionStatus(this.tx()!._id, status, adminNotes).subscribe({
      next: (res) => {
        this.tx.set(res.data.transaction);
        this.snackBar.open('Status updated', 'Close', { duration: 3000 });
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to update', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  releaseFunds(): void {
    this.actionLoading.set(true);
    this.adminService.releaseFunds(this.tx()!._id).subscribe({
      next: () => {
        this.snackBar.open('Funds released successfully', 'Close', { duration: 3000 });
        this.loadDetail(this.tx()!._id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Release failed', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  refundTransaction(): void {
    this.actionLoading.set(true);
    this.adminService.refundTransaction(this.tx()!._id, this.refundReason || undefined).subscribe({
      next: () => {
        this.snackBar.open('Transaction refunded', 'Close', { duration: 3000 });
        this.loadDetail(this.tx()!._id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Refund failed', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  getDocumentUrl(doc: DocumentRecord): string {
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${doc.fileUrl}`;
  }

  private loadDetail(id: string): void {
    this.adminService.getTransactionDetail(id).subscribe({
      next: (res) => {
        this.tx.set(res.data.transaction);
        this.payments.set(res.data.payments);
        this.documents.set(res.data.documents);
        this.statusForm.patchValue({ status: res.data.transaction.status });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
