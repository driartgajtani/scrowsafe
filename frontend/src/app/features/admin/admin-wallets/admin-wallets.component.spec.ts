import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminWalletsComponent } from './admin-wallets.component';
import { AdminService } from '../../../core/services/admin.service';
import { of, throwError } from 'rxjs';

describe('AdminWalletsComponent', () => {
  let adminService: any;
  let snackBar: any;

  beforeEach(async () => {
    adminService = {
      getWallets: jest.fn().mockReturnValue(of({
        success: true,
        data: { wallets: [{ network: 'ethereum', label: 'ETH', address: '0x123', explorer: 'https://etherscan.io', enabled: true }] },
      })),
      updateWallet: jest.fn().mockReturnValue(of({ success: true })),
    };
    snackBar = { open: jest.fn() };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminService, useValue: adminService },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AdminWalletsComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load wallets on init', () => {
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    fixture.detectChanges();
    expect(adminService.getWallets).toHaveBeenCalled();
    expect(fixture.componentInstance.wallets().length).toBe(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load wallets error', () => {
    adminService.getWallets.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should toggle wallet enabled state', () => {
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    fixture.detectChanges();
    const wallet = fixture.componentInstance.wallets()[0];
    const originalEnabled = wallet.enabled;
    fixture.componentInstance.toggleEnabled(wallet);
    expect(wallet.enabled).toBe(!originalEnabled);
    expect(adminService.updateWallet).toHaveBeenCalled();
  });

  it('should save wallet successfully', () => {
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    fixture.detectChanges();
    const wallet = fixture.componentInstance.wallets()[0];
    wallet.editing = true;
    fixture.componentInstance.saveWallet(wallet);
    expect(wallet.saving).toBe(false);
    expect(wallet.editing).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Wallet updated', 'Close', expect.any(Object));
  });

  it('should handle save wallet error', () => {
    adminService.updateWallet.mockReturnValue(throwError(() => ({ error: { message: 'Fail' } })));
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    fixture.detectChanges();
    const wallet = fixture.componentInstance.wallets()[0];
    fixture.componentInstance.saveWallet(wallet);
    expect(wallet.saving).toBe(false);
    expect(snackBar.open).toHaveBeenCalledWith('Fail', 'Close', expect.any(Object));
  });

  it('should show default error on save wallet failure', () => {
    adminService.updateWallet.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(AdminWalletsComponent);
    fixture.detectChanges();
    const wallet = fixture.componentInstance.wallets()[0];
    fixture.componentInstance.saveWallet(wallet);
    expect(snackBar.open).toHaveBeenCalledWith('Failed to update wallet', 'Close', expect.any(Object));
  });
});
