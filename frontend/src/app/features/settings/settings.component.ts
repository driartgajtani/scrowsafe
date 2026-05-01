import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="settings-page">
      <h1>Account Settings</h1>

      <mat-card class="settings-card">
        <h2><mat-icon>person</mat-icon> Profile Information</h2>

        <div class="info-row">
          <span class="info-label">Role</span>
          <span class="info-value role-badge">{{ authService.user()?.role | titlecase }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Member since</span>
          <span class="info-value">{{ authService.user()?.createdAt | date:'mediumDate' }}</span>
        </div>

        <mat-divider></mat-divider>

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="form-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Full Name</mat-label>
            <input matInput formControlName="name">
            @if (profileForm.get('name')?.hasError('required')) {
              <mat-error>Name is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email Address</mat-label>
            <input matInput formControlName="email" type="email">
            @if (profileForm.get('email')?.hasError('email')) {
              <mat-error>Enter a valid email</mat-error>
            }
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit"
                  [disabled]="profileForm.invalid || profileForm.pristine || savingProfile()">
            @if (savingProfile()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              Save Profile
            }
          </button>
        </form>
      </mat-card>

      <mat-card class="settings-card">
        <h2><mat-icon>lock</mat-icon> Change Password</h2>

        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="form-section">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Current Password</mat-label>
            <input matInput formControlName="currentPassword" [type]="hideCurrentPw() ? 'password' : 'text'">
            <button mat-icon-button matSuffix type="button"
                    (click)="hideCurrentPw.set(!hideCurrentPw())">
              <mat-icon>{{ hideCurrentPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (passwordForm.get('currentPassword')?.hasError('required')) {
              <mat-error>Current password is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>New Password</mat-label>
            <input matInput formControlName="newPassword" [type]="hideNewPw() ? 'password' : 'text'">
            <button mat-icon-button matSuffix type="button"
                    (click)="hideNewPw.set(!hideNewPw())">
              <mat-icon>{{ hideNewPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (passwordForm.get('newPassword')?.hasError('minlength')) {
              <mat-error>Password must be at least 8 characters</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Confirm New Password</mat-label>
            <input matInput formControlName="confirmPassword" [type]="hideConfirmPw() ? 'password' : 'text'">
            <button mat-icon-button matSuffix type="button"
                    (click)="hideConfirmPw.set(!hideConfirmPw())">
              <mat-icon>{{ hideConfirmPw() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (passwordMismatch()) {
              <mat-error>Passwords do not match</mat-error>
            }
          </mat-form-field>

          <button mat-flat-button color="primary" type="submit"
                  [disabled]="passwordForm.invalid || savingPassword() || passwordMismatch()">
            @if (savingPassword()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              Change Password
            }
          </button>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 600px;
      margin: 0 auto;
      h1 { font-size: 24px; font-weight: 700; margin-bottom: 24px; }
    }
    .settings-card {
      padding: 24px;
      margin-bottom: 20px;
      h2 {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 16px;
        font-size: 18px;
        font-weight: 600;
        mat-icon { color: #6c63ff; }
      }
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }
    .info-label { color: rgba(0,0,0,0.54); }
    .role-badge {
      background: #ede7f6;
      color: #6c63ff;
      padding: 2px 10px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 12px;
    }
    mat-divider { margin: 16px 0; }
    .form-section { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
    .full-width { width: 100%; }
  `],
})
export class SettingsComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  savingProfile = signal(false);
  savingPassword = signal(false);
  hideCurrentPw = signal(true);
  hideNewPw = signal(true);
  hideConfirmPw = signal(true);

  constructor(
    private fb: FormBuilder,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.authService.user();
    this.profileForm = this.fb.group({
      name: [user?.name || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });
  }

  passwordMismatch(): boolean {
    const { newPassword, confirmPassword } = this.passwordForm.value;
    return confirmPassword?.length > 0 && newPassword !== confirmPassword;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile.set(true);
    this.authService.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.savingProfile.set(false);
        this.profileForm.markAsPristine();
        this.snackBar.open('Profile updated', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.snackBar.open(err.error?.message || 'Failed to update profile', 'Close', { duration: 5000 });
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch()) return;
    this.savingPassword.set(true);
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.snackBar.open(res.message || 'Password changed', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.snackBar.open(err.error?.message || 'Failed to change password', 'Close', { duration: 5000 });
      },
    });
  }
}
