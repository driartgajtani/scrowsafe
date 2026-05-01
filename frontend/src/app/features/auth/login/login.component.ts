import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
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
    <div class="auth-container">
      <mat-card class="auth-card">
        <div class="auth-header">
          <mat-icon class="auth-icon">shield</mat-icon>
          <h1>Welcome Back</h1>
          <p>Sign in to your Scrowsafe account</p>
        </div>

        @if (emailNotVerified()) {
          <div class="verify-banner">
            <mat-icon>mark_email_unread</mat-icon>
            <div>
              <strong>Email not verified</strong>
              <p>Please check your inbox and click the verification link before logging in.</p>
              @if (resendSuccess()) {
                <small class="resend-ok">Verification email sent! Check your inbox.</small>
              } @else {
                <button mat-stroked-button (click)="resendVerification()" [disabled]="resendLoading()" class="resend-btn">
                  @if (resendLoading()) {
                    Sending...
                  } @else {
                    Resend Verification Email
                  }
                </button>
              }
            </div>
          </div>
        }

        @if (error()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email" placeholder="you@example.com">
            <mat-icon matPrefix>email</mat-icon>
            @if (form.get('email')?.hasError('required') && form.get('email')?.touched) {
              <mat-error>Email is required</mat-error>
            }
            @if (form.get('email')?.hasError('email') && form.get('email')?.touched) {
              <mat-error>Enter a valid email</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Password</mat-label>
            <input matInput formControlName="password" [type]="hidePassword() ? 'password' : 'text'">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="hidePassword.set(!hidePassword())">
              <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('password')?.hasError('required') && form.get('password')?.touched) {
              <mat-error>Password is required</mat-error>
            }
          </mat-form-field>

          <div class="forgot-link">
            <a routerLink="/forgot-password">Forgot password?</a>
          </div>

          <button mat-flat-button color="primary" type="submit" class="full-width submit-btn"
                  [disabled]="loading()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Sign In
            }
          </button>
        </form>

        <p class="auth-footer">
          Don't have an account? <a routerLink="/register">Create one</a>
        </p>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 112px);
    }
    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 40px;
    }
    .auth-header {
      text-align: center;
      margin-bottom: 32px;
      h1 { margin: 12px 0 4px; font-size: 24px; font-weight: 700; }
      p { color: rgba(0,0,0,0.54); margin: 0; }
    }
    .auth-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #6c63ff;
    }
    .full-width { width: 100%; }
    .submit-btn {
      height: 48px;
      font-size: 16px;
      margin-top: 8px;
    }
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
    .verify-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-radius: 8px;
      margin-bottom: 16px;
      mat-icon { color: #e65100; font-size: 24px; width: 24px; height: 24px; margin-top: 2px; }
      strong { display: block; color: #e65100; font-size: 14px; }
      p { margin: 4px 0 10px; color: #bf360c; font-size: 13px; }
    }
    .resend-btn { font-size: 12px; }
    .resend-ok { color: #2e7d32; font-weight: 600; }
    .forgot-link {
      text-align: right;
      margin: -4px 0 12px;
      a { color: #6c63ff; font-size: 13px; text-decoration: none; }
    }
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      color: rgba(0,0,0,0.54);
      a { color: #6c63ff; font-weight: 600; text-decoration: none; }
    }

    @media (max-width: 480px) {
      .auth-card { padding: 24px 16px; }
      .auth-header h1 { font-size: 20px; }
    }
  `],
})
export class LoginComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal('');
  hidePassword = signal(true);
  emailNotVerified = signal(false);
  resendLoading = signal(false);
  resendSuccess = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.emailNotVerified.set(false);
    this.resendSuccess.set(false);

    this.authService.login(this.form.value).subscribe({
      next: () => {
        const user = this.authService.user();
        this.router.navigate([user?.role === 'admin' ? '/admin' : '/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.error?.code === 'EMAIL_NOT_VERIFIED') {
          this.emailNotVerified.set(true);
          this.error.set('');
        } else {
          this.error.set(err.error?.message || 'Login failed. Please try again.');
        }
      },
    });
  }

  resendVerification(): void {
    const email = this.form.get('email')?.value;
    if (!email) return;
    this.resendLoading.set(true);
    this.authService.resendVerification(email).subscribe({
      next: () => {
        this.resendLoading.set(false);
        this.resendSuccess.set(true);
      },
      error: () => {
        this.resendLoading.set(false);
        this.error.set('Failed to resend verification email.');
      },
    });
  }
}
