import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule],
  template: `
    <div class="home">
      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <h1>Secure Social&nbsp;Media Account Transfers</h1>
          <p class="hero-sub">
            Scrowsafe acts as a trusted escrow middleman so buyers and sellers
            can exchange social media accounts safely — funds are held until
            the handover is complete.
          </p>
          <div class="hero-actions">
            @if (auth.isAuthenticated()) {
              <a mat-flat-button color="primary" routerLink="/transactions/create" class="big-btn">
                <mat-icon>add</mat-icon> Start a Transaction
              </a>
            } @else {
              <a mat-flat-button color="primary" routerLink="/register" class="big-btn">
                Get Started Free
              </a>
              <a mat-stroked-button routerLink="/login" class="big-btn outline-btn">
                Sign In
              </a>
            }
          </div>
        </div>
        <div class="hero-visual">
          <mat-icon class="hero-icon">verified_user</mat-icon>
        </div>
      </section>

      <!-- How it works -->
      <section class="section">
        <h2 class="section-title">How It Works</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-badge">
              <div class="step-number">1</div>
              <mat-icon>description</mat-icon>
            </div>
            <h3>Create a Deal</h3>
            <p>Buyer or seller initiates a transaction with account details and agreed price.</p>
          </div>
          <div class="step-card">
            <div class="step-badge">
              <div class="step-number">2</div>
              <mat-icon>account_balance_wallet</mat-icon>
            </div>
            <h3>Buyer Pays Escrow</h3>
            <p>Funds are securely held by Scrowsafe — never sent directly to the seller.</p>
          </div>
          <div class="step-card">
            <div class="step-badge">
              <div class="step-number">3</div>
              <mat-icon>vpn_key</mat-icon>
            </div>
            <h3>Seller Transfers Account</h3>
            <p>The seller hands over credentials and the buyer verifies access.</p>
          </div>
          <div class="step-card">
            <div class="step-badge">
              <div class="step-number">4</div>
              <mat-icon>check_circle</mat-icon>
            </div>
            <h3>Funds Released</h3>
            <p>Once confirmed, Scrowsafe releases payment to the seller instantly.</p>
          </div>
        </div>
      </section>

      <!-- Features -->
      <section class="section alt-bg">
        <h2 class="section-title">Why Scrowsafe?</h2>
        <div class="features-grid">
          <mat-card class="feature-card">
            <mat-icon class="feature-icon blue">shield</mat-icon>
            <h3>Escrow Protection</h3>
            <p>Your money is held safely until both parties fulfill their obligations.</p>
          </mat-card>
          <mat-card class="feature-card">
            <mat-icon class="feature-icon green">speed</mat-icon>
            <h3>Fast Transfers</h3>
            <p>Most transactions complete within 24 hours after credentials are shared.</p>
          </mat-card>
          <mat-card class="feature-card">
            <mat-icon class="feature-icon orange">support_agent</mat-icon>
            <h3>Admin Mediation</h3>
            <p>Disputes are handled by our team with live chat support on every deal.</p>
          </mat-card>
          <mat-card class="feature-card">
            <mat-icon class="feature-icon purple">payments</mat-icon>
            <h3>Multiple Payment Methods</h3>
            <p>Pay with card (Stripe), wire transfer, or crypto across 10+ networks.</p>
          </mat-card>
          <mat-card class="feature-card">
            <mat-icon class="feature-icon blue">lock</mat-icon>
            <h3>Encrypted Credentials</h3>
            <p>Account credentials are encrypted at rest — only accessible when needed.</p>
          </mat-card>
          <mat-card class="feature-card">
            <mat-icon class="feature-icon green">language</mat-icon>
            <h3>All Major Platforms</h3>
            <p>Instagram, TikTok, YouTube, Twitter, Snapchat, Spotify, Gaming & more.</p>
          </mat-card>
        </div>
      </section>

      <!-- CTA -->
      <section class="section cta-section">
        <h2>Ready to make a secure deal?</h2>
        <p>Join thousands of buyers and sellers who trust Scrowsafe for safe account transfers.</p>
        @if (!auth.isAuthenticated()) {
          <a mat-flat-button color="primary" routerLink="/register" class="big-btn">
            Create Free Account
          </a>
        } @else {
          <a mat-flat-button color="primary" routerLink="/transactions/create" class="big-btn">
            <mat-icon>add</mat-icon> New Transaction
          </a>
        }
      </section>
    </div>
  `,
  styles: [`
    .home { margin: -24px; }

    /* Hero */
    .hero {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 48px;
      padding: 80px 48px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .hero-content { max-width: 560px; }
    .hero h1 {
      font-size: 42px;
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 16px;
    }
    .hero-sub {
      font-size: 17px;
      line-height: 1.6;
      color: rgba(255,255,255,0.75);
      margin: 0 0 32px;
    }
    .hero-actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .big-btn {
      height: 48px;
      padding: 0 28px !important;
      font-size: 15px;
      font-weight: 600;
      border-radius: 8px !important;
    }
    .outline-btn {
      color: white !important;
      border-color: rgba(255,255,255,0.4) !important;
    }
    .hero-visual {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .hero-icon {
      font-size: 180px;
      width: 180px;
      height: 180px;
      color: rgba(108,99,255,0.3);
    }

    /* Sections */
    .section {
      padding: 72px 48px;
      text-align: center;
    }
    .alt-bg { background: #f5f5f7; }
    .section-title {
      font-size: 30px;
      font-weight: 700;
      margin: 0 0 48px;
    }

    /* Steps */
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 32px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .step-card {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      h3 { margin: 0 0 8px; font-size: 16px; font-weight: 600; }
      p { font-size: 14px; color: rgba(0,0,0,0.6); margin: 0; line-height: 1.5; }
    }
    .step-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: #6c63ff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #6c63ff;
      color: white;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    /* Features */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }
    .feature-card {
      padding: 32px 24px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      h3 { margin: 16px 0 8px; font-size: 16px; font-weight: 600; }
      p { font-size: 14px; color: rgba(0,0,0,0.6); margin: 0; line-height: 1.5; }
    }
    .feature-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      padding: 12px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      &.blue { background: #e8eaf6; color: #3f51b5; }
      &.green { background: #e8f5e9; color: #2e7d32; }
      &.orange { background: #fff3e0; color: #ef6c00; }
      &.purple { background: #ede7f6; color: #6c63ff; }
    }

    /* CTA */
    .cta-section {
      background: linear-gradient(135deg, #1a1a2e, #16213e);
      color: white;
      h2 { font-size: 28px; font-weight: 700; margin: 0 0 12px; }
      p { color: rgba(255,255,255,0.7); font-size: 16px; margin: 0 0 28px; }
    }

    @media (max-width: 768px) {
      .hero {
        flex-direction: column;
        padding: 48px 24px;
        text-align: center;
      }
      .hero h1 { font-size: 30px; }
      .hero-actions { justify-content: center; }
      .hero-visual { display: none; }
      .section { padding: 48px 24px; }
      .steps-grid { grid-template-columns: repeat(2, 1fr); }
      .features-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class HomeComponent {
  constructor(public auth: AuthService) {}
}
