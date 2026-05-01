import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('ResetPasswordComponent', () => {
  let authService: any;

  beforeEach(async () => {
    authService = { resetPassword: jest.fn().mockReturnValue(of({})) };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: (key: string) => key === 'token' ? 'test-token' : null } } },
        },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(ResetPasswordComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should read token from route on init', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.token()).toBe('test-token');
  });

  it('should default to empty string when no token in route', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(ResetPasswordComponent, { set: { imports: [], schemas: [NO_ERRORS_SCHEMA] } }).compileComponents();
    const f = TestBed.createComponent(ResetPasswordComponent);
    f.detectChanges();
    expect(f.componentInstance.token()).toBe('');
  });

  it('should detect password mismatch', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    const comp = fixture.componentInstance;
    comp.form.get('password')?.setValue('password123');
    comp.form.get('confirmPassword')?.setValue('different');
    expect(comp.mismatch()).toBe(true);
  });

  it('should not detect mismatch when passwords match', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    const comp = fixture.componentInstance;
    comp.form.get('password')?.setValue('password123');
    comp.form.get('confirmPassword')?.setValue('password123');
    expect(comp.mismatch()).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.componentInstance.submit();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });

  it('should submit and show success', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.form.setValue({ password: 'newpass12', confirmPassword: 'newpass12' });
    comp.submit();
    expect(authService.resetPassword).toHaveBeenCalledWith('test-token', 'newpass12');
    expect(comp.success()).toBe(true);
    expect(comp.loading()).toBe(false);
  });

  it('should handle submit error', () => {
    authService.resetPassword.mockReturnValue(throwError(() => ({ error: { message: 'Expired' } })));
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.form.setValue({ password: 'newpass12', confirmPassword: 'newpass12' });
    comp.submit();
    expect(comp.errorMsg()).toBe('Expired');
    expect(comp.loading()).toBe(false);
  });

  it('should show default error on submit failure', () => {
    authService.resetPassword.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.form.setValue({ password: 'newpass12', confirmPassword: 'newpass12' });
    comp.submit();
    expect(comp.errorMsg()).toBe('Reset failed. The link may have expired.');
  });

  it('should not submit when passwords mismatch', () => {
    const fixture = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.form.setValue({ password: 'newpass12', confirmPassword: 'different' });
    comp.submit();
    expect(authService.resetPassword).not.toHaveBeenCalled();
  });
});
