import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
  ],
  template: `
    <mat-toolbar class="navbar">
      <a routerLink="/" class="brand">
        <mat-icon>shield</mat-icon>
        <span class="brand-text">Scrowsafe</span>
      </a>

      <nav class="nav-links public-links desktop-only">
        <a mat-button routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
        <a mat-button routerLink="/pricing" routerLinkActive="active">Pricing</a>
        <a mat-button routerLink="/contact" routerLinkActive="active">Contact</a>
      </nav>

      <span class="spacer"></span>

      @if (auth.isAuthenticated()) {
        <nav class="nav-links desktop-only">
          <a mat-button routerLink="/dashboard" routerLinkActive="active">
            <mat-icon>dashboard</mat-icon>
            Dashboard
          </a>
          <a mat-button routerLink="/transactions" routerLinkActive="active">
            <mat-icon>swap_horiz</mat-icon>
            Transactions
          </a>
          @if (auth.isAdmin()) {
            <a mat-button routerLink="/admin" routerLinkActive="active">
              <mat-icon>admin_panel_settings</mat-icon>
              Admin
            </a>
          }
        </nav>

        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-btn desktop-only">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="menu-header">
            <strong>{{ auth.user()?.name }}</strong>
            <small>{{ auth.user()?.email }}</small>
            <span class="role-badge">{{ auth.user()?.role | uppercase }}</span>
          </div>
          <mat-divider></mat-divider>
          <a mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon>
            <span>Settings</span>
          </a>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon>logout</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      } @else {
        <a mat-button routerLink="/login" class="login-btn desktop-only">Login</a>
        <a mat-flat-button color="primary" routerLink="/register" class="desktop-only">Register</a>
      }

      <!-- Mobile menu button -->
      <button mat-icon-button class="mobile-menu-btn mobile-only" [matMenuTriggerFor]="mobileMenu">
        <mat-icon>menu</mat-icon>
      </button>
      <mat-menu #mobileMenu="matMenu" class="mobile-nav-menu">
        <a mat-menu-item routerLink="/">
          <mat-icon>home</mat-icon> <span>Home</span>
        </a>
        <a mat-menu-item routerLink="/pricing">
          <mat-icon>sell</mat-icon> <span>Pricing</span>
        </a>
        <a mat-menu-item routerLink="/contact">
          <mat-icon>mail</mat-icon> <span>Contact</span>
        </a>
        <mat-divider></mat-divider>
        @if (auth.isAuthenticated()) {
          <a mat-menu-item routerLink="/dashboard">
            <mat-icon>dashboard</mat-icon> <span>Dashboard</span>
          </a>
          <a mat-menu-item routerLink="/transactions">
            <mat-icon>swap_horiz</mat-icon> <span>Transactions</span>
          </a>
          @if (auth.isAdmin()) {
            <a mat-menu-item routerLink="/admin">
              <mat-icon>admin_panel_settings</mat-icon> <span>Admin</span>
            </a>
          }
          <mat-divider></mat-divider>
          <a mat-menu-item routerLink="/settings">
            <mat-icon>settings</mat-icon> <span>Settings</span>
          </a>
          <button mat-menu-item (click)="auth.logout()">
            <mat-icon>logout</mat-icon> <span>Logout</span>
          </button>
        } @else {
          <a mat-menu-item routerLink="/login">
            <mat-icon>login</mat-icon> <span>Login</span>
          </a>
          <a mat-menu-item routerLink="/register">
            <mat-icon>person_add</mat-icon> <span>Register</span>
          </a>
        }
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [`
    .navbar {
      background: #1a1a2e;
      color: white;
      position: sticky;
      top: 0;
      z-index: 1000;
      padding: 0 24px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: white;
      font-size: 20px;
      font-weight: 700;
    }
    .brand mat-icon {
      color: #6c63ff;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }
    .spacer { flex: 1; }
    .nav-links {
      display: flex;
      gap: 4px;
      margin-right: 8px;
    }
    .nav-links a {
      color: rgba(255,255,255,0.8);
      mat-icon { margin-right: 4px; font-size: 18px; }
    }
    .nav-links a.active { color: #6c63ff; }
    .public-links {
      margin-left: 16px;
      margin-right: 0;
    }
    .login-btn { color: white !important; }
    .user-btn { color: rgba(255,255,255,0.9); }
    .mobile-menu-btn { color: white; }
    .mobile-only { display: none; }
    .menu-header {
      padding: 12px 16px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      small { color: rgba(0,0,0,0.54); }
    }
    .role-badge {
      display: inline-block;
      margin-top: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      background: #6c63ff;
      color: white;
      width: fit-content;
    }

    @media (max-width: 768px) {
      .desktop-only { display: none !important; }
      .mobile-only { display: inline-flex !important; }
      .navbar { padding: 0 12px; }
    }
  `],
})
export class NavbarComponent {
  constructor(public auth: AuthService) {}
}
