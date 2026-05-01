import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsComponent } from './settings.component';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('SettingsComponent', () => {
  let authService: any;
  let snackBar: any;

  beforeEach(async () => {
    authService = {
      user: jest.fn().mockReturnValue({ _id: '1', name: 'John', email: 'john@test.com', role: 'buyer' }) as any,
      updateProfile: jest.fn().mockReturnValue(of({ success: true, data: { user: {} } })),
      changePassword: jest.fn().mockReturnValue(of({ success: true, message: 'Password changed', data: null })),
    };
    snackBar = { open: jest.fn() };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(SettingsComponent, {
        set: { imports: [CommonModule], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize forms on init', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    expect(comp.profileForm.get('name')?.value).toBe('John');
    expect(comp.profileForm.get('email')?.value).toBe('john@test.com');
    expect(comp.passwordForm).toBeDefined();
  });

  it('should detect password mismatch', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.get('newPassword')?.setValue('newpass123');
    comp.passwordForm.get('confirmPassword')?.setValue('different');
    expect(comp.passwordMismatch()).toBe(true);
  });

  it('should not detect mismatch when passwords match', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.get('newPassword')?.setValue('newpass123');
    comp.passwordForm.get('confirmPassword')?.setValue('newpass123');
    expect(comp.passwordMismatch()).toBe(false);
  });

  it('should not save profile when form is invalid', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    fixture.componentInstance.profileForm.get('name')?.setValue('');
    fixture.componentInstance.saveProfile();
    expect(authService.updateProfile).not.toHaveBeenCalled();
  });

  it('should save profile successfully', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.profileForm.get('name')?.setValue('Updated');
    comp.profileForm.markAsDirty();
    comp.saveProfile();
    expect(authService.updateProfile).toHaveBeenCalled();
    expect(comp.savingProfile()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Profile updated', 'Close', expect.any(Object));
  });

  it('should handle profile save error', () => {
    authService.updateProfile.mockReturnValue(throwError(() => ({ error: { message: 'Fail' } })));
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.saveProfile();
    expect(comp.savingProfile()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Fail', 'Close', expect.any(Object));
  });

  it('should show default error on profile save failure', () => {
    authService.updateProfile.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.saveProfile();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to update profile', 'Close', expect.any(Object));
  });

  it('should not change password when form is invalid', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    fixture.componentInstance.changePassword();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('should not change password when passwords mismatch', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newpass12', confirmPassword: 'different' });
    comp.changePassword();
    expect(authService.changePassword).not.toHaveBeenCalled();
  });

  it('should change password successfully', () => {
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newpass12', confirmPassword: 'newpass12' });
    comp.changePassword();
    expect(authService.changePassword).toHaveBeenCalledWith({ currentPassword: 'old', newPassword: 'newpass12' });
    expect(comp.savingPassword()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Password changed', 'Close', expect.any(Object));
  });

  it('should handle change password error', () => {
    authService.changePassword.mockReturnValue(throwError(() => ({ error: { message: 'Wrong password' } })));
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newpass12', confirmPassword: 'newpass12' });
    comp.changePassword();
    expect(comp.savingPassword()).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Wrong password', 'Close', expect.any(Object));
  });

  it('should show default error on password change failure', () => {
    authService.changePassword.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newpass12', confirmPassword: 'newpass12' });
    comp.changePassword();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to change password', 'Close', expect.any(Object));
  });

  it('should use default message when res.message is empty', () => {
    authService.changePassword.mockReturnValue(of({ success: true, data: null }));
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.passwordForm.setValue({ currentPassword: 'old', newPassword: 'newpass12', confirmPassword: 'newpass12' });
    comp.changePassword();
    expect(snackBar.open).toHaveBeenCalledWith('Password changed', 'Close', expect.any(Object));
  });

  it('should handle null user in ngOnInit', () => {
    authService.user = jest.fn().mockReturnValue(null);
    const fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.profileForm.get('name')?.value).toBe('');
    expect(fixture.componentInstance.profileForm.get('email')?.value).toBe('');
  });
});
