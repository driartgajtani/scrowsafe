import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="contact-page">
      <div class="page-header">
        <h1>Contact Us</h1>
        <p>Have a question or need help? We'd love to hear from you.</p>
      </div>

      <div class="contact-grid">
        <!-- Contact Form -->
        <mat-card class="form-card">
          @if (sent()) {
            <div class="success-state">
              <mat-icon>check_circle</mat-icon>
              <h2>Message Sent!</h2>
              <p>Thank you for reaching out. We'll get back to you as soon as possible.</p>
              <button mat-flat-button color="primary" (click)="reset()">Send Another Message</button>
            </div>
          } @else {
            <h2>Send a Message</h2>
            <form [formGroup]="form" (ngSubmit)="submit()">
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Your Name</mat-label>
                  <input matInput formControlName="name">
                  <mat-icon matPrefix>person</mat-icon>
                </mat-form-field>
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Email Address</mat-label>
                  <input matInput formControlName="email" type="email">
                  <mat-icon matPrefix>email</mat-icon>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Subject</mat-label>
                <mat-select formControlName="subject">
                  <mat-option value="general">General Inquiry</mat-option>
                  <mat-option value="support">Transaction Support</mat-option>
                  <mat-option value="dispute">Dispute / Refund</mat-option>
                  <mat-option value="partnership">Partnership</mat-option>
                  <mat-option value="bug">Bug Report</mat-option>
                  <mat-option value="other">Other</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Message</mat-label>
                <textarea matInput formControlName="message" rows="6"
                          placeholder="Describe your question or issue..."></textarea>
              </mat-form-field>

              <button mat-flat-button color="primary" type="submit"
                      [disabled]="form.invalid || sending()" class="full-width submit-btn">
                @if (sending()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Send Message
                }
              </button>
            </form>
          }
        </mat-card>

        <!-- Contact Info -->
        <div class="info-side">
          <mat-card class="info-item">
            <mat-icon>email</mat-icon>
            <div>
              <h3>Email</h3>
              <p>support&#64;scrowsafe.com</p>
            </div>
          </mat-card>
          <mat-card class="info-item">
            <mat-icon>schedule</mat-icon>
            <div>
              <h3>Response Time</h3>
              <p>Usually within 24 hours</p>
            </div>
          </mat-card>
          <mat-card class="info-item">
            <mat-icon>chat</mat-icon>
            <div>
              <h3>Live Chat</h3>
              <p>Available on every transaction page for real-time help</p>
            </div>
          </mat-card>
          <mat-card class="info-item">
            <mat-icon>help_outline</mat-icon>
            <div>
              <h3>FAQ</h3>
              <p>Check our pricing page for common questions about fees and payments</p>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contact-page { max-width: 960px; margin: 0 auto; }
    .page-header {
      text-align: center;
      margin-bottom: 40px;
      h1 { font-size: 32px; font-weight: 800; margin: 0 0 8px; }
      p { color: rgba(0,0,0,0.54); font-size: 16px; margin: 0; }
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 24px;
      align-items: start;
    }

    .form-card {
      padding: 32px;
      h2 { margin: 0 0 24px; font-size: 20px; font-weight: 700; }
    }
    .form-row {
      display: flex;
      gap: 16px;
    }
    .half-width { flex: 1; }
    .full-width { width: 100%; }
    .submit-btn {
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 4px;
    }

    .success-state {
      text-align: center;
      padding: 32px 16px;
      mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        color: #2e7d32;
      }
      h2 { margin: 16px 0 8px; font-size: 22px; font-weight: 700; }
      p { color: rgba(0,0,0,0.54); margin: 0 0 24px; }
    }

    .info-side { display: flex; flex-direction: column; gap: 12px; }
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 20px;
      mat-icon {
        color: #6c63ff;
        font-size: 24px;
        width: 24px;
        height: 24px;
        margin-top: 2px;
      }
      h3 { margin: 0 0 4px; font-size: 15px; font-weight: 600; }
      p { margin: 0; font-size: 13px; color: rgba(0,0,0,0.6); line-height: 1.4; }
    }

    @media (max-width: 768px) {
      .contact-grid { grid-template-columns: 1fr; }
      .form-row { flex-direction: column; gap: 0; }
      .half-width { width: 100%; }
    }
  `],
})
export class ContactComponent {
  form: FormGroup;
  sending = signal(false);
  sent = signal(false);

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private auth: AuthService
  ) {
    const user = this.auth.user();
    this.form = this.fb.group({
      name: [user?.name || '', Validators.required],
      email: [user?.email || '', [Validators.required, Validators.email]],
      subject: ['general', Validators.required],
      message: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.sending.set(true);

    // Simulate sending — in production, wire up to a backend endpoint or email API
    setTimeout(() => {
      this.sending.set(false);
      this.sent.set(true);
    }, 1200);
  }

  reset(): void {
    this.sent.set(false);
    this.form.reset({ name: '', email: '', subject: 'general', message: '' });
  }
}
