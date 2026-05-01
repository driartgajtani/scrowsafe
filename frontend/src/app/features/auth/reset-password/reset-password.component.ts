import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
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
          <h1>Reset Password</h1>
          <p>Enter your new password below.</p>
        </div>

        @if (!token()) {
          <div class="error-box">Invalid or missing reset token. Please request a new reset link.</div>
          <a mat-flat-button color="primary" routerLink="/forgot-password" class="full-width">
            Request New Link
          </a>
        } @else if (success()) {
          <div class="success-box">
            <mat-icon>check_circle</mat-icon>
            <p>Your password has been reset successfully!</p>
          </div>
          <a mat-flat-button color="primary" routerLink="/login" class="full-width">Go to Login</a>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input matInput formControlName="password" [type]="hidePw() ? 'password' : 'text'">
              <button mat-icon-button matSuffix type="button" (click)="hidePw.set(!hidePw())">
                <mat-icon>{{ hidePw() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (form.get('password')?.hasError('minlength')) {
                <mat-error>At least 8 characters required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm Password</mat-label>
              <input matInput formControlName="confirmPassword" [type]="hideConfirm() ? 'password' : 'text'">
              <button mat-icon-button matSuffix type="button" (click)="hideConfirm.set(!hideConfirm())">
                <mat-icon>{{ hideConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (mismatch()) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            @if (errorMsg()) {
              <div class="error-box">{{ errorMsg() }}</div>
            }

            <button mat-flat-button color="primary" type="submit"
                    [disabled]="form.invalid || loading() || mismatch()" class="full-width">
              @if (loading()) {
                <mat-spinner diameter="18"></mat-spinner>
              } @else {
                Reset Password
              }
            </button>
          </form>
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

    @media (max-width: 480px) {
      .auth-card { padding: 24px 16px; }
    }
  `],
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token = signal('');
  loading = signal(false);
  success = signal(false);
  errorMsg = signal('');
  hidePw = signal(true);
  hideConfirm = signal(true);

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token') || '');
  }

  mismatch(): boolean {
    const { password, confirmPassword } = this.form.value;
    return confirmPassword?.length > 0 && password !== confirmPassword;
  }

  submit(): void {
    if (this.form.invalid || this.mismatch()) return;
    this.loading.set(true);
    this.errorMsg.set('');

    this.authService.resetPassword(this.token(), this.form.value.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Reset failed. The link may have expired.');
      },
    });
  }
}
