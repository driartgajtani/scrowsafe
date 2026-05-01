import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
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
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <mat-card class="auth-card">
        <div class="auth-header">
          <mat-icon class="auth-icon">shield</mat-icon>
          <h1>Create Account</h1>
          <p>Join Scrowsafe for secure account transfers</p>
        </div>

        @if (verificationSent()) {
          <div class="success-banner">
            <mat-icon>mark_email_read</mat-icon>
            <div>
              <strong>Check your email!</strong>
              <p>We've sent a verification link to your email address. Please click it to activate your account.</p>
            </div>
          </div>
          <a mat-flat-button color="primary" routerLink="/login" class="full-width" style="margin-top:8px;">
            Go to Login
          </a>
        } @else {
        @if (error()) {
          <div class="error-banner">
            <mat-icon>error_outline</mat-icon>
            {{ error() }}
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="name" placeholder="John Doe">
            <mat-icon matPrefix>person</mat-icon>
            @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>

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
            @if (form.get('password')?.hasError('minlength') && form.get('password')?.touched) {
              <mat-error>Password must be at least 8 characters</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm Password</mat-label>
            <input matInput formControlName="confirmPassword" [type]="hideConfirm() ? 'password' : 'text'">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix type="button" (click)="hideConfirm.set(!hideConfirm())">
              <mat-icon>{{ hideConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.get('confirmPassword')?.touched && passwordMismatch()) {
              <mat-error>Passwords do not match</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>I want to</mat-label>
            <mat-select formControlName="role">
              <mat-option value="buyer">
                <mat-icon>shopping_cart</mat-icon> Buy accounts
              </mat-option>
              <mat-option value="seller">
                <mat-icon>storefront</mat-icon> Sell accounts
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>badge</mat-icon>
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit" class="full-width submit-btn"
                  [disabled]="loading() || passwordMismatch()">
            @if (loading()) {
              <mat-spinner diameter="20"></mat-spinner>
            } @else {
              Create Account
            }
          </button>
        </form>

        <p class="auth-footer">
          Already have an account? <a routerLink="/login">Sign in</a>
        </p>
        }
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
    .success-banner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      background: #e8f5e9;
      border-radius: 8px;
      mat-icon { color: #2e7d32; font-size: 28px; width: 28px; height: 28px; margin-top: 2px; }
      strong { display: block; color: #1b5e20; font-size: 15px; }
      p { margin: 4px 0 0; color: #2e7d32; font-size: 13px; }
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
export class RegisterComponent {
  form: FormGroup;
  loading = signal(false);
  error = signal('');
  verificationSent = signal(false);
  hidePassword = signal(true);
  hideConfirm = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['buyer', Validators.required],
    });
  }

  passwordMismatch(): boolean {
    const { password, confirmPassword } = this.form.value;
    return confirmPassword?.length > 0 && password !== confirmPassword;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');

    const { confirmPassword, ...payload } = this.form.value;
    this.authService.register(payload).subscribe({
      next: (res) => {
        if (res.data?.requiresVerification) {
          this.loading.set(false);
          this.verificationSent.set(true);
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
      },
    });
  }
}
