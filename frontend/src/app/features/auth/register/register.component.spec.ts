import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('RegisterComponent', () => {
  let authService: any;
  let router: Router;

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockReturnValue(of({ success: true, data: { user: {}, accessToken: 'a', refreshToken: 'r' } })),
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
      .overrideComponent(RegisterComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should detect password mismatch', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.form.get('password')?.setValue('password123');
    component.form.get('confirmPassword')?.setValue('different');
    expect(component.passwordMismatch()).toBe(true);
  });

  it('should not detect mismatch when passwords match', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const component = fixture.componentInstance;
    component.form.get('password')?.setValue('password123');
    component.form.get('confirmPassword')?.setValue('password123');
    expect(component.passwordMismatch()).toBe(false);
  });

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    fixture.componentInstance.onSubmit();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('should submit and navigate to dashboard', () => {
    const fixture = TestBed.createComponent(RegisterComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ name: 'John', email: 'j@test.com', password: 'pass12345', confirmPassword: 'pass12345', role: 'buyer' });
    comp.onSubmit();
    expect(authService.register).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should show verification sent when requiresVerification', () => {
    authService.register.mockReturnValue(of({ success: true, data: { requiresVerification: true } }));
    const fixture = TestBed.createComponent(RegisterComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ name: 'John', email: 'j@test.com', password: 'pass12345', confirmPassword: 'pass12345', role: 'buyer' });
    comp.onSubmit();
    expect(comp.verificationSent()).toBe(true);
    expect(comp.loading()).toBe(false);
  });

  it('should handle registration error', () => {
    authService.register.mockReturnValue(throwError(() => ({ error: { message: 'Email taken' } })));
    const fixture = TestBed.createComponent(RegisterComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ name: 'John', email: 'j@test.com', password: 'pass12345', confirmPassword: 'pass12345', role: 'buyer' });
    comp.onSubmit();
    expect(comp.error()).toBe('Email taken');
    expect(comp.loading()).toBe(false);
  });

  it('should show default error message', () => {
    authService.register.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(RegisterComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({ name: 'John', email: 'j@test.com', password: 'pass12345', confirmPassword: 'pass12345', role: 'buyer' });
    comp.onSubmit();
    expect(comp.error()).toBe('Registration failed. Please try again.');
  });
});
