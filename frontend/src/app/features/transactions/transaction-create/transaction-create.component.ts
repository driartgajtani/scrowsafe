import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { PLATFORMS, FeeCalculation } from '../../../core/models/transaction.model';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs';

@Component({
  selector: 'app-transaction-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatDividerModule,
  ],
  template: `
    <div class="create-page">
      <div class="page-header">
        <button mat-icon-button routerLink="/transactions">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1>Create Transaction</h1>
      </div>

      <div class="create-layout">
        <mat-card class="form-card">
          @if (error()) {
            <div class="error-banner">
              <mat-icon>error_outline</mat-icon>
              {{ error() }}
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <h3>Your Role</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>I am the</mat-label>
              <mat-select formControlName="role">
                <mat-option value="buyer">
                  <mat-icon>shopping_cart</mat-icon> Buyer
                </mat-option>
                <mat-option value="seller">
                  <mat-icon>storefront</mat-icon> Seller
                </mat-option>
              </mat-select>
            </mat-form-field>

            <h3>Counterparty</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>{{ form.get('role')?.value === 'buyer' ? 'Seller' : 'Buyer' }}'s Email</mat-label>
              <input matInput formControlName="counterpartyEmail" type="email"
                     placeholder="counterparty@example.com">
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('counterpartyEmail')?.hasError('required') && form.get('counterpartyEmail')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (form.get('counterpartyEmail')?.hasError('email') && form.get('counterpartyEmail')?.touched) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>

            <h3>Account Details</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Platform</mat-label>
              <mat-select formControlName="platform">
                @for (p of platforms; track p.value) {
                  <mat-option [value]="p.value">
                    <mat-icon>{{ p.icon }}</mat-icon> {{ p.label }}
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>

            <div class="row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Account Username</mat-label>
                <input matInput formControlName="accountUsername" placeholder="&#64;username">
                <mat-icon matPrefix>alternate_email</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Amount (USD)</mat-label>
                <input matInput formControlName="amount" type="number" min="1">
                <mat-icon matPrefix>attach_money</mat-icon>
                @if (form.get('amount')?.hasError('required') && form.get('amount')?.touched) {
                  <mat-error>Amount is required</mat-error>
                }
                @if (form.get('amount')?.hasError('min') && form.get('amount')?.touched) {
                  <mat-error>Minimum \$1</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Account Description (optional)</mat-label>
              <textarea matInput formControlName="accountDescription" rows="3"
                        placeholder="Describe the account details..."></textarea>
            </mat-form-field>

            <h3>Payment Method</h3>
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Payment Method</mat-label>
              <mat-select formControlName="paymentMethod">
                <mat-option value="crypto">
                  <mat-icon>currency_bitcoin</mat-icon> Cryptocurrency
                </mat-option>
                <mat-option value="wire">
                  <mat-icon>account_balance</mat-icon> Wire Transfer
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-flat-button color="primary" type="submit" class="full-width submit-btn"
                    [disabled]="loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Create Transaction
              }
            </button>
          </form>
        </mat-card>

        <mat-card class="fee-card">
          <h3>Fee Summary</h3>
          @if (feeData()) {
            <div class="fee-breakdown">
              <div class="fee-row">
                <span>Account Price</span>
                <strong>\${{ feeData()!.amount.toLocaleString() }}</strong>
              </div>
              <div class="fee-row">
                <span>Fee Rate</span>
                <span>{{ (feeData()!.feeRate * 100).toFixed(1) }}%</span>
              </div>
              <div class="fee-row">
                <span>Escrow Fee</span>
                <span>\${{ feeData()!.escrowFee.toLocaleString() }}</span>
              </div>
              <mat-divider></mat-divider>
              <div class="fee-row total">
                <span>Total to Pay</span>
                <strong>\${{ feeData()!.totalToPay.toLocaleString() }}</strong>
              </div>
            </div>
          } @else {
            <p class="fee-placeholder">
              Enter a platform and amount to see the fee breakdown
            </p>
          }

          <div class="trust-badges">
            <div class="badge">
              <mat-icon>verified_user</mat-icon>
              <small>Secure Escrow</small>
            </div>
            <div class="badge">
              <mat-icon>lock</mat-icon>
              <small>Encrypted Data</small>
            </div>
            <div class="badge">
              <mat-icon>support_agent</mat-icon>
              <small>24/7 Support</small>
            </div>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .create-page { max-width: 960px; margin: 0 auto; }
    .page-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      h1 { margin: 0; font-size: 24px; font-weight: 700; }
    }
    .create-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 768px) {
      .create-layout { grid-template-columns: 1fr; }
      .row { flex-direction: column; gap: 0; }
      .half-width { width: 100%; }
      .form-card { padding: 20px; }
    }
    .form-card { padding: 32px; }
    .fee-card {
      padding: 24px;
      position: sticky;
      top: 88px;
    }
    h3 { margin: 24px 0 12px; font-size: 16px; font-weight: 600; &:first-child { margin-top: 0; } }
    .full-width { width: 100%; }
    .half-width { width: calc(50% - 8px); }
    .row { display: flex; gap: 16px; }
    .submit-btn { height: 48px; font-size: 16px; margin-top: 16px; }
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fdecea;
      color: #b71c1c;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
    }
    .fee-breakdown { display: flex; flex-direction: column; gap: 12px; }
    .fee-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 14px;
      &.total { font-size: 18px; padding-top: 12px; }
    }
    .fee-placeholder { color: rgba(0,0,0,0.4); font-size: 14px; text-align: center; padding: 24px 0; }
    .trust-badges {
      display: flex;
      justify-content: space-around;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid rgba(0,0,0,0.08);
    }
    .badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      mat-icon { color: #6c63ff; }
      small { color: rgba(0,0,0,0.54); font-size: 11px; }
    }
  `],
})
export class TransactionCreateComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal('');
  feeData = signal<FeeCalculation | null>(null);
  readonly platforms = PLATFORMS;

  constructor(
    private fb: FormBuilder,
    private transactionService: TransactionService,
    private authService: AuthService,
    private router: Router
  ) {
    const userRole = this.authService.user()?.role;
    this.form = this.fb.group({
      role: [userRole === 'seller' ? 'seller' : 'buyer', Validators.required],
      counterpartyEmail: ['', [Validators.required, Validators.email]],
      platform: ['', Validators.required],
      accountUsername: [''],
      accountDescription: [''],
      amount: [null, [Validators.required, Validators.min(1)]],
      paymentMethod: ['crypto', Validators.required],
    });

    this.form.get('platform')?.valueChanges.subscribe(() => this.calculateFee());
    this.form.get('amount')?.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(() => this.calculateFee());
  }

  private calculateFee(): void {
    const platform = this.form.get('platform')?.value;
    const amount = this.form.get('amount')?.value;
    if (!platform || !amount || amount < 1) {
      this.feeData.set(null);
      return;
    }

    this.transactionService.calculateFee(platform, amount).subscribe({
      next: (res) => this.feeData.set(res.data),
      error: () => this.feeData.set(null),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const value = this.form.value;
    this.transactionService.create({
      counterpartyEmail: value.counterpartyEmail,
      platform: value.platform,
      amount: value.amount,
      role: value.role,
      accountUsername: value.accountUsername || undefined,
      accountDescription: value.accountDescription || undefined,
      paymentMethod: value.paymentMethod,
    }).subscribe({
      next: (res) => {
        this.router.navigate(['/transactions', res.data.transaction._id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Failed to create transaction.');
      },
    });
  }
}
