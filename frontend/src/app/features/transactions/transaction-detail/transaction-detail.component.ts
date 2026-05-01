import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { TransactionService } from '../../../core/services/transaction.service';
import { PaymentService } from '../../../core/services/payment.service';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { Transaction } from '../../../core/models/transaction.model';
import { DocumentRecord } from '../../../core/models/payment.model';
import { StatusLabelPipe } from '../../../shared/pipes/status.pipe';
import { TidioService } from '../../../core/services/tidio.service';
import { WalletService, WalletInfo } from '../../../core/services/wallet.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-transaction-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    MatTooltipModule,
    ClipboardModule,
    StatusLabelPipe,
  ],
  template: `
    <div class="detail-page">
      @if (loading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
        </div>
      } @else if (tx()) {
        <div class="page-header">
          <button mat-icon-button routerLink="/transactions">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ tx()!.transactionId }}</h1>
            <span class="status-chip status-{{ tx()!.status }}">
              {{ tx()!.status | statusLabel }}
            </span>
          </div>
        </div>

        <!-- Progress Stepper -->
        <mat-card class="progress-card">
          <mat-stepper [linear]="false" [selectedIndex]="tx()!.progressStep - 1" #stepper>
            <mat-step label="Created" [completed]="tx()!.progressStep > 1">
              <ng-template matStepLabel>Transaction Created</ng-template>
            </mat-step>
            <mat-step label="Payment" [completed]="tx()!.progressStep > 2">
              <ng-template matStepLabel>Payment Received</ng-template>
            </mat-step>
            <mat-step label="Credentials" [completed]="tx()!.progressStep > 3">
              <ng-template matStepLabel>Credentials Submitted</ng-template>
            </mat-step>
            <mat-step label="Complete" [completed]="tx()!.status === 'completed'">
              <ng-template matStepLabel>Completed</ng-template>
            </mat-step>
          </mat-stepper>
        </mat-card>

        <div class="detail-grid">
          <!-- Transaction Info -->
          <mat-card class="info-card">
            <h3>Transaction Details</h3>
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
                <strong class="highlight">\${{ tx()!.totalToPay.toLocaleString() }}</strong>
              </div>
              <div class="info-item">
                <small>Payment Method</small>
                <strong>{{ tx()!.paymentMethod || 'Not set' | titlecase }}</strong>
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
          </mat-card>

          <!-- Parties -->
          <mat-card class="info-card">
            <h3>Parties</h3>
            <div class="party">
              <mat-icon>shopping_cart</mat-icon>
              <div>
                <small>Buyer</small>
                <strong>{{ getBuyerName() }}</strong>
                <span class="email">{{ getBuyerEmail() }}</span>
              </div>
              @if (isBuyer()) {
                <span class="you-badge">You</span>
              }
            </div>
            <mat-divider></mat-divider>
            <div class="party">
              <mat-icon>storefront</mat-icon>
              <div>
                <small>Seller</small>
                <strong>{{ getSellerName() }}</strong>
                <span class="email">{{ getSellerEmail() }}</span>
              </div>
              @if (isSeller()) {
                <span class="you-badge">You</span>
              }
            </div>
          </mat-card>

          <!-- Actions -->
          @if (showPaymentAction()) {
            <mat-card class="action-card">
              <h3>
                <mat-icon>payment</mat-icon>
                Make Payment
              </h3>
              <p>Complete your payment to proceed with the transaction.</p>

              @if (tx()!.paymentMethod === 'wire') {
                <form [formGroup]="wireForm" (ngSubmit)="submitWirePayment()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Wire Reference Number</mat-label>
                    <input matInput formControlName="referenceNumber">
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit"
                          [disabled]="actionLoading()" class="full-width">
                    Submit Wire Details
                  </button>
                </form>
              } @else if (tx()!.paymentMethod === 'crypto') {
                <form [formGroup]="cryptoForm" (ngSubmit)="submitCryptoPayment()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Blockchain Network</mat-label>
                    <mat-select formControlName="network">
                      @for (net of cryptoNetworks(); track net.value) {
                        <mat-option [value]="net.value">{{ net.label }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>

                  @if (selectedNetwork()) {
                    <div class="wallet-box">
                      <div class="wallet-label">
                        <mat-icon>account_balance_wallet</mat-icon>
                        Send exactly <strong>\${{ tx()!.totalToPay.toLocaleString() }}</strong>
                        in {{ selectedNetwork()!.label }} to:
                      </div>
                      <div class="wallet-address">
                        <code>{{ selectedNetwork()!.wallet }}</code>
                        <button mat-icon-button matTooltip="Copy address"
                                (click)="copyWallet()" type="button">
                          <mat-icon>content_copy</mat-icon>
                        </button>
                      </div>
                      <small class="wallet-warning">
                        <mat-icon>warning</mat-icon>
                        Only send on the {{ selectedNetwork()!.label }} network.
                        Funds sent on the wrong network may be lost permanently.
                      </small>
                    </div>
                  }

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Transaction Hash</mat-label>
                    <input matInput formControlName="txHash"
                           placeholder="0x7a8f3b...">
                    <mat-icon matPrefix>tag</mat-icon>
                    <mat-hint>Paste the full TX hash from your wallet or block explorer</mat-hint>
                  </mat-form-field>
                  <button mat-flat-button color="primary" type="submit"
                          [disabled]="actionLoading() || cryptoForm.invalid" class="full-width">
                    Submit Crypto Payment
                  </button>
                </form>
              }
            </mat-card>
          }

          @if (showCredentialsAction()) {
            <mat-card class="action-card">
              <h3>
                <mat-icon>vpn_key</mat-icon>
                Submit Credentials
              </h3>
              <p>Provide the account credentials securely. All data is encrypted.</p>
              <form [formGroup]="credentialsForm" (ngSubmit)="submitCredentials()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Account Credentials</mat-label>
                  <textarea matInput formControlName="credentials" rows="3"
                            placeholder="Username, password, or login details"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Payout Information</mat-label>
                  <textarea matInput formControlName="payoutInfo" rows="2"
                            placeholder="How should you receive payment?"></textarea>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Recovery Email (optional)</mat-label>
                  <input matInput formControlName="recoveryEmail" type="email">
                </mat-form-field>
                <button mat-flat-button color="primary" type="submit"
                        [disabled]="actionLoading()" class="full-width">
                  @if (actionLoading()) {
                    <mat-spinner diameter="20"></mat-spinner>
                  } @else {
                    Submit Credentials
                  }
                </button>
              </form>
            </mat-card>
          }

          <!-- Documents -->
          <mat-card class="info-card">
            <div class="section-header">
              <h3>Documents</h3>
              <button mat-stroked-button (click)="fileInput.click()" [disabled]="actionLoading()">
                <mat-icon>upload_file</mat-icon>
                Upload
              </button>
              <input #fileInput type="file" hidden (change)="uploadDocument($event)"
                     accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx">
            </div>
            @if (documents().length === 0) {
              <p class="no-docs">No documents uploaded yet</p>
            } @else {
              @for (doc of documents(); track doc._id) {
                <div class="doc-item">
                  <mat-icon>description</mat-icon>
                  <div class="doc-info">
                    <strong>{{ doc.originalName }}</strong>
                    <small>{{ doc.type | titlecase }} &middot; {{ formatFileSize(doc.fileSize) }}</small>
                  </div>
                  <a mat-icon-button [href]="getDocumentUrl(doc)" target="_blank">
                    <mat-icon>download</mat-icon>
                  </a>
                </div>
              }
            }
          </mat-card>

          <!-- Chat with Admin -->
          <mat-card class="chat-card" (click)="openChat()">
            <mat-icon>chat</mat-icon>
            <div class="chat-info">
              <strong>Chat with Admin</strong>
              <small>Get help or ask questions about this transaction</small>
            </div>
            <mat-icon class="chevron">chevron_right</mat-icon>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-page { max-width: 960px; margin: 0 auto; }
    .loading-container { display: flex; justify-content: center; padding: 60px; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 24px; font-weight: 700; font-family: monospace; }
    }
    .progress-card { padding: 24px; margin-bottom: 24px; }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    @media (max-width: 768px) {
      .detail-grid { grid-template-columns: 1fr; }
      .page-header h1 { font-size: 18px; }
      .progress-card { padding: 12px; overflow-x: auto; }
      .info-card { padding: 16px; }
      .action-card { padding: 16px; }
      .info-grid { grid-template-columns: 1fr; }
      .wallet-address code { font-size: 11px; }
    }
    .info-card { padding: 24px; }
    .action-card {
      padding: 24px;
      grid-column: 1 / -1;
      border-left: 4px solid #6c63ff;
    }
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
    .highlight { color: #6c63ff; }
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
    .you-badge {
      margin-left: auto;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      background: #e8f5e9;
      color: #2e7d32;
    }
    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 8px;
    }
    .status-pending { background: #fff3e0; color: #e65100; }
    .status-payment_received { background: #e3f2fd; color: #1565c0; }
    .status-credentials_received { background: #e8f5e9; color: #2e7d32; }
    .status-takeover_in_progress { background: #ede7f6; color: #4527a0; }
    .status-completed { background: #e8f5e9; color: #1b5e20; }
    .status-refunded { background: #fce4ec; color: #b71c1c; }
    .status-disputed { background: #fbe9e7; color: #bf360c; }
    .full-width { width: 100%; }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h3 { margin: 0; }
    }
    .no-docs { color: rgba(0,0,0,0.4); text-align: center; padding: 16px; }
    .doc-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      border-bottom: 1px solid rgba(0,0,0,0.06);
      mat-icon { color: #6c63ff; }
      &:last-child { border-bottom: none; }
    }
    .doc-info {
      flex: 1;
      strong { display: block; font-size: 14px; }
      small { color: rgba(0,0,0,0.54); }
    }
    .chat-card {
      grid-column: 1 / -1;
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 16px;
      padding: 20px 24px;
      cursor: pointer;
      transition: box-shadow 0.2s, border-color 0.2s;
      border: 1px solid rgba(108, 99, 255, 0.2);
      &:hover {
        box-shadow: 0 4px 12px rgba(108, 99, 255, 0.15);
        border-color: #6c63ff;
      }
      > mat-icon:first-child {
        color: white;
        background: #6c63ff;
        border-radius: 10px;
        padding: 8px;
        font-size: 24px;
        width: 24px;
        height: 24px;
        flex-shrink: 0;
      }
      .chevron {
        flex-shrink: 0;
        color: rgba(0,0,0,0.38);
      }
    }
    .chat-info {
      flex: 1;
      min-width: 0;
      strong { display: block; font-size: 15px; }
      small { color: rgba(0,0,0,0.54); font-size: 13px; }
    }
    .wallet-box {
      background: #f0f4ff;
      border: 1px solid #c5cae9;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .wallet-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      margin-bottom: 12px;
      mat-icon { color: #6c63ff; font-size: 20px; width: 20px; height: 20px; }
    }
    .wallet-address {
      display: flex;
      align-items: center;
      gap: 8px;
      background: white;
      border: 1px dashed #9fa8da;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
      code {
        flex: 1;
        font-size: 13px;
        word-break: break-all;
        color: #1a1a2e;
        font-weight: 600;
      }
    }
    .wallet-warning {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      color: #e65100;
      font-size: 12px;
      line-height: 1.4;
      mat-icon { font-size: 16px; width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    }
  `],
})
export class TransactionDetailComponent implements OnInit, OnDestroy {
  loading = signal(true);
  actionLoading = signal(false);
  tx = signal<Transaction | null>(null);
  documents = signal<DocumentRecord[]>([]);

  wireForm: FormGroup;
  cryptoForm: FormGroup;
  credentialsForm: FormGroup;

  cryptoNetworks = signal<{ value: string; label: string; wallet: string; explorer: string }[]>([]);

  selectedNetwork(): { value: string; label: string; wallet: string; explorer: string } | undefined {
    const val = this.cryptoForm?.get('network')?.value;
    return this.cryptoNetworks().find((n) => n.value === val);
  }

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private paymentService: PaymentService,
    private documentService: DocumentService,
    public authService: AuthService,
    private snackBar: MatSnackBar,
    private clipboard: Clipboard,
    private tidioService: TidioService,
    private walletService: WalletService
  ) {
    this.wireForm = this.fb.group({
      referenceNumber: ['', Validators.required],
    });
    this.cryptoForm = this.fb.group({
      txHash: ['', Validators.required],
      network: ['ethereum', Validators.required],
    });
    this.credentialsForm = this.fb.group({
      credentials: ['', Validators.required],
      payoutInfo: ['', Validators.required],
      recoveryEmail: [''],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadTransaction(id);
    this.loadDocuments(id);
    this.loadWallets();
  }

  private loadWallets(): void {
    this.walletService.getWallets().subscribe({
      next: (res) => {
        this.cryptoNetworks.set(
          res.data.wallets.map((w) => ({
            value: w.network,
            label: w.label,
            wallet: w.address,
            explorer: w.explorer,
          }))
        );
        if (this.cryptoNetworks().length > 0) {
          this.cryptoForm.get('network')?.setValue(this.cryptoNetworks()[0].value);
        }
      },
    });
  }

  ngOnDestroy(): void {
  }

  openChat(): void {
    const user = this.authService.user();
    const transaction = this.tx();
    if (!user || !transaction) return;

    this.tidioService.load().then(() => {
      this.tidioService.identify(user, transaction);
      this.tidioService.show();
    });
  }

  isBuyer(): boolean {
    const buyer = this.tx()?.buyerId;
    return typeof buyer === 'object' && buyer._id === this.authService.user()?._id;
  }

  isSeller(): boolean {
    const seller = this.tx()?.sellerId;
    return typeof seller === 'object' && seller._id === this.authService.user()?._id;
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

  showPaymentAction(): boolean {
    return this.isBuyer() && this.tx()?.status === 'pending';
  }

  showCredentialsAction(): boolean {
    return this.isSeller() && this.tx()?.status === 'payment_received';
  }

  async initiateStripePayment(): Promise<void> {
    this.actionLoading.set(true);
    const stripe = await this.paymentService.getStripe();
    if (!stripe) {
      this.snackBar.open('Failed to load payment processor', 'Close', { duration: 3000 });
      this.actionLoading.set(false);
      return;
    }

    this.paymentService.createPaymentIntent(this.tx()!._id).subscribe({
      next: async (res) => {
        const { error } = await stripe.confirmCardPayment(res.data.clientSecret, {
          payment_method: {
            card: (await stripe.elements().create('card')) as any,
          },
        });

        if (error) {
          this.snackBar.open(error.message || 'Payment failed', 'Close', { duration: 5000 });
          this.actionLoading.set(false);
        } else {
          this.paymentService.confirmPayment(res.data.paymentIntentId).subscribe({
            next: () => {
              this.snackBar.open('Payment successful!', 'Close', { duration: 3000 });
              this.loadTransaction(this.tx()!._id);
              this.actionLoading.set(false);
            },
            error: () => {
              this.actionLoading.set(false);
            },
          });
        }
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Failed to create payment', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  submitWirePayment(): void {
    if (this.wireForm.invalid) return;
    this.actionLoading.set(true);
    this.paymentService.submitWirePayment(this.tx()!._id, this.wireForm.value.referenceNumber).subscribe({
      next: () => {
        this.snackBar.open('Wire payment details submitted', 'Close', { duration: 3000 });
        this.loadTransaction(this.tx()!._id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Submission failed', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  submitCryptoPayment(): void {
    if (this.cryptoForm.invalid) return;
    this.actionLoading.set(true);
    const { txHash, network } = this.cryptoForm.value;
    this.paymentService.submitCryptoPayment(this.tx()!._id, txHash, network).subscribe({
      next: () => {
        this.snackBar.open('Crypto payment details submitted', 'Close', { duration: 3000 });
        this.loadTransaction(this.tx()!._id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Submission failed', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  submitCredentials(): void {
    if (this.credentialsForm.invalid) {
      this.credentialsForm.markAllAsTouched();
      return;
    }
    this.actionLoading.set(true);
    this.transactionService.submitCredentials(this.tx()!._id, this.credentialsForm.value).subscribe({
      next: () => {
        this.snackBar.open('Credentials submitted securely', 'Close', { duration: 3000 });
        this.loadTransaction(this.tx()!._id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Submission failed', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  uploadDocument(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.actionLoading.set(true);
    this.documentService.upload(this.tx()!._id, file).subscribe({
      next: () => {
        this.snackBar.open('Document uploaded', 'Close', { duration: 3000 });
        this.loadDocuments(this.tx()!._id);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Upload failed', 'Close', { duration: 5000 });
        this.actionLoading.set(false);
      },
    });
  }

  getDocumentUrl(doc: DocumentRecord): string {
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${doc.fileUrl}`;
  }

  copyWallet(): void {
    const net = this.selectedNetwork();
    if (net) {
      this.clipboard.copy(net.wallet);
      this.snackBar.open('Wallet address copied!', 'Close', { duration: 2000 });
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  private loadTransaction(id: string): void {
    this.transactionService.getById(id).subscribe({
      next: (res) => {
        this.tx.set(res.data.transaction);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private loadDocuments(id: string): void {
    this.documentService.getByTransaction(id).subscribe({
      next: (res) => this.documents.set(res.data.documents),
    });
  }
}
