import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

function adminGuardTestProviders() {
  return [
    provideHttpClient(),
    provideHttpClientTesting(),
    AuthService,
    { provide: Router, useValue: { createUrlTree: jest.fn(), navigate: jest.fn() } },
    { provide: PLATFORM_ID, useValue: 'browser' },
  ];
}

describe('adminGuard', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: adminGuardTestProviders(),
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('should return true for admin user', () => {
    localStorage.setItem('scrowsafe_user', JSON.stringify({ _id: '1', role: 'admin' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: adminGuardTestProviders(),
    });
    const result = TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(result).toBe(true);
  });

  it('should redirect to /dashboard for non-admin', () => {
    localStorage.setItem('scrowsafe_user', JSON.stringify({ _id: '1', role: 'buyer' }));
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: adminGuardTestProviders(),
    });
    const rtr = TestBed.inject(Router);
    TestBed.runInInjectionContext(() => adminGuard({} as any, {} as any));
    expect(rtr.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  });
});
