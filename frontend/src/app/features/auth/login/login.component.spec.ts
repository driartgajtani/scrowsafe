import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { LoginComponent } from './login.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('LoginComponent', () => {
  let authService: any;
  let router: Router;

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockReturnValue(of({ success: true, data: { user: { _id: '1', role: 'buyer' }, accessToken: 'a', refreshToken: 'r' } })),
      resendVerification: jest.fn().mockReturnValue(of({ success: true })),
      user: jest.fn().mockReturnValue({ _id: '1', role: 'buyer' }),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(LoginComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should have login form', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance.form).toBeDefined();
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.onSubmit();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('should submit and navigate to dashboard for buyer', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com', password: 'pass123' });
    comp.onSubmit();
    expect(authService.login).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to admin for admin user', () => {
    authService.user.mockReturnValue({ _id: '1', role: 'admin' });
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'admin@test.com', password: 'pass123' });
    comp.onSubmit();
    expect(router.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('should handle EMAIL_NOT_VERIFIED error', () => {
    authService.login.mockReturnValue(throwError(() => ({ error: { code: 'EMAIL_NOT_VERIFIED' } })));
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com', password: 'pass123' });
    comp.onSubmit();
    expect(comp.emailNotVerified()).toBe(true);
    expect(comp.error()).toBe('');
  });

  it('should handle generic login error', () => {
    authService.login.mockReturnValue(throwError(() => ({ error: { message: 'Bad creds' } })));
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com', password: 'wrong' });
    comp.onSubmit();
    expect(comp.error()).toBe('Bad creds');
    expect(comp.loading()).toBe(false);
  });

  it('should show default error message', () => {
    authService.login.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com', password: 'wrong' });
    comp.onSubmit();
    expect(comp.error()).toBe('Login failed. Please try again.');
  });

  it('should resend verification email', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.get('email')?.setValue('test@test.com');
    comp.resendVerification();
    expect(authService.resendVerification).toHaveBeenCalledWith('test@test.com');
    expect(comp.resendSuccess()).toBe(true);
  });

  it('should not resend when email is empty', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.get('email')?.setValue('');
    comp.resendVerification();
    expect(authService.resendVerification).not.toHaveBeenCalled();
  });

  it('should handle resend verification error', () => {
    authService.resendVerification.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(LoginComponent);
    const comp = fixture.componentInstance;
    comp.form.get('email')?.setValue('test@test.com');
    comp.resendVerification();
    expect(comp.error()).toBe('Failed to resend verification email.');
  });
});
