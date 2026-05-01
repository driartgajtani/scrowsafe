import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('Auth Guards', () => {
  let authService: AuthService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        { provide: Router, useValue: { createUrlTree: jest.fn((path) => ({ toString: () => path.join('/') })) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  describe('authGuard', () => {
    it('should return true if access token exists', () => {
      localStorage.setItem('scrowsafe_access_token', 'token');
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /login if no token', () => {
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('guestGuard', () => {
    it('should return true if no token', () => {
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toBe(true);
    });

    it('should redirect to /dashboard if token exists', () => {
      localStorage.setItem('scrowsafe_access_token', 'token');
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(router.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});
