import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('ForgotPasswordComponent', () => {
  let authService: any;

  beforeEach(async () => {
    authService = { forgotPassword: jest.fn().mockReturnValue(of({})) };

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
      .overrideComponent(ForgotPasswordComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.submit();
    expect(authService.forgotPassword).not.toHaveBeenCalled();
  });

  it('should submit and show success', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com' });
    comp.submit();
    expect(authService.forgotPassword).toHaveBeenCalledWith('test@test.com');
    expect(comp.sent()).toBe(true);
    expect(comp.loading()).toBe(false);
  });

  it('should handle submit error', () => {
    authService.forgotPassword.mockReturnValue(throwError(() => ({ error: { message: 'Not found' } })));
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com' });
    comp.submit();
    expect(comp.errorMsg()).toBe('Not found');
    expect(comp.loading()).toBe(false);
  });

  it('should show default error message', () => {
    authService.forgotPassword.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ email: 'test@test.com' });
    comp.submit();
    expect(comp.errorMsg()).toBe('Something went wrong. Please try again.');
  });
});
