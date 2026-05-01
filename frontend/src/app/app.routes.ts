import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'pricing',
    loadComponent: () =>
      import('./features/pricing/pricing.component').then((m) => m.PricingComponent),
  },
  {
    path: 'contact',
    loadComponent: () =>
      import('./features/contact/contact.component').then((m) => m.ContactComponent),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent
      ),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then(
        (m) => m.ResetPasswordComponent
      ),
  },
  {
    path: 'verify-email',
    loadComponent: () =>
      import('./features/auth/verify-email/verify-email.component').then(
        (m) => m.VerifyEmailComponent
      ),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/transactions/transaction-list/transaction-list.component').then(
            (m) => m.TransactionListComponent
          ),
      },
      {
        path: 'create',
        loadComponent: () =>
          import('./features/transactions/transaction-create/transaction-create.component').then(
            (m) => m.TransactionCreateComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./features/transactions/transaction-detail/transaction-detail.component').then(
            (m) => m.TransactionDetailComponent
          ),
      },
    ],
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./features/admin/admin-transactions/admin-transactions.component').then(
            (m) => m.AdminTransactionsComponent
          ),
      },
      {
        path: 'transactions/:id',
        loadComponent: () =>
          import('./features/admin/admin-transaction-detail/admin-transaction-detail.component').then(
            (m) => m.AdminTransactionDetailComponent
          ),
      },
      {
        path: 'wallets',
        loadComponent: () =>
          import('./features/admin/admin-wallets/admin-wallets.component').then(
            (m) => m.AdminWalletsComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
