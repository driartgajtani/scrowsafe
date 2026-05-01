import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { VerifyEmailComponent } from './verify-email.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('VerifyEmailComponent', () => {
  let authService: any;

  function createComponent(token: string | null) {
    TestBed.resetTestingModule();
    authService = { verifyEmail: jest.fn().mockReturnValue(of({ success: true })) };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: (key: string) => key === 'token' ? token : null } } },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(VerifyEmailComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    return TestBed.createComponent(VerifyEmailComponent);
  }

  it('should create', () => {
    const fixture = createComponent('verify-token');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should verify email on init with valid token', () => {
    const fixture = createComponent('verify-token');
    fixture.detectChanges();
    expect(authService.verifyEmail).toHaveBeenCalledWith('verify-token');
    expect(fixture.componentInstance.success()).toBe(true);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should show error when no token is provided', () => {
    const fixture = createComponent(null);
    fixture.detectChanges();
    expect(authService.verifyEmail).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMsg()).toBe('No verification token provided.');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle verification error', () => {
    const fixture = createComponent('bad-token');
    authService.verifyEmail.mockReturnValue(throwError(() => ({ error: { message: 'Invalid token' } })));
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMsg()).toBe('Invalid token');
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should show default error message', () => {
    const fixture = createComponent('bad-token');
    authService.verifyEmail.mockReturnValue(throwError(() => ({})));
    fixture.detectChanges();
    expect(fixture.componentInstance.errorMsg()).toBe('Invalid or expired verification link.');
  });
});
