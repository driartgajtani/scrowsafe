import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
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
    <div class="auth-page">
      <mat-card class="auth-card">
        <div class="auth-header">
          <mat-icon class="logo-icon">shield</mat-icon>
        </div>

        @if (loading()) {
          <div class="status-box">
            <mat-spinner diameter="36"></mat-spinner>
            <p>Verifying your email...</p>
          </div>
        } @else if (success()) {
          <div class="status-box success">
            <mat-icon>check_circle</mat-icon>
            <h2>Email Verified!</h2>
            <p>Your account has been verified successfully. You can now log in.</p>
            <a mat-flat-button color="primary" routerLink="/login" class="full-width">Go to Login</a>
          </div>
        } @else {
          <div class="status-box error">
            <mat-icon>error</mat-icon>
            <h2>Verification Failed</h2>
            <p>{{ errorMsg() }}</p>
            <a mat-flat-button color="primary" routerLink="/login" class="full-width">Go to Login</a>
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
      margin-bottom: 8px;
    }
    .logo-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #6c63ff;
    }
    .status-box {
      text-align: center;
      padding: 16px 0;
      mat-spinner { margin: 0 auto 16px; }
      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
      }
      h2 { margin: 12px 0 8px; font-size: 22px; font-weight: 700; }
      p { color: rgba(0,0,0,0.6); font-size: 14px; margin: 0 0 20px; }
    }
    .success mat-icon { color: #2e7d32; }
    .error mat-icon { color: #c62828; }
    .full-width { width: 100%; }

    @media (max-width: 480px) {
      .auth-card { padding: 24px 16px; }
    }
  `],
})
export class VerifyEmailComponent implements OnInit {
  loading = signal(true);
  success = signal(false);
  errorMsg = signal('');

  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading.set(false);
      this.errorMsg.set('No verification token provided.');
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Invalid or expired verification link.');
      },
    });
  }
}
