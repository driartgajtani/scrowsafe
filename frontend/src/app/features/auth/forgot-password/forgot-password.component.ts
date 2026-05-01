import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-page">
      <mat-card class="auth-card">
        <div class="auth-header">
          <mat-icon class="logo-icon">shield</mat-icon>
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send you a reset link.</p>
        </div>

        @if (sent()) {
          <div class="success-box">
            <mat-icon>check_circle</mat-icon>
            <p>If an account exists with that email, we've sent a password reset link. Please check your inbox.</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/login" class="full-width">Back to Login</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email Address</mat-label>
              <input matInput formControlName="email" type="email" placeholder="you@example.com">
              <mat-icon matPrefix>email</mat-icon>
              @if (form.get('email')?.hasError('email')) {
                <mat-error>Enter a valid email</mat-error>
              }
            </mat-form-field>

            @if (errorMsg()) {
              <div class="error-box">{{ errorMsg() }}</div>
            }

            <button mat-flat-button color="primary" type="submit"
                    [disabled]="form.invalid || loading()" class="full-width">
              @if (loading()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                Send Reset Link
              }
            </button>
          </form>

          <div class="auth-footer">
            <a routerLink="/login">Back to Login</a>
          </div>
        }
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 64px);
      background: #f5f5f7;
    }
    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 40px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 24px;
      h1 { margin: 12px 0 4px; font-size: 22px; font-weight: 700; }
      p { color: rgba(0,0,0,0.54); font-size: 14px; margin: 0; }
    }
    .logo-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #6c63ff;
    }
    .full-width { width: 100%; }
    .success-box {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 20px;
      mat-icon { color: #2e7d32; margin-top: 2px; }
      p { margin: 0; font-size: 14px; color: #1b5e20; }
    }
    .error-box {
      background: #fce4ec;
      color: #c62828;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 13px;
      margin-bottom: 12px;
    }
    .auth-footer {
      text-align: center;
      margin-top: 16px;
      a { color: #6c63ff; text-decoration: none; font-size: 14px; }
    }

    @media (max-width: 480px) {
      .auth-card { padding: 24px 16px; }
    }
  `],
})
export class ForgotPasswordComponent {
  form: FormGroup;
  loading = signal(false);
  sent = signal(false);
  errorMsg = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Something went wrong. Please try again.');
      },
    });
  }
}
