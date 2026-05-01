import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardComponent } from './dashboard.component';
import { StatusLabelPipe, StatusColorPipe } from '../../shared/pipes/status.pipe';
import { TransactionService } from '../../core/services/transaction.service';
import { AuthService } from '../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('DashboardComponent', () => {
  let transactionService: any;

  beforeEach(async () => {
    transactionService = {
      list: jest.fn().mockReturnValue(of({
        success: true,
        data: {
          transactions: [
            { _id: 'tx1', status: 'pending', amount: 100, platform: 'instagram' },
            { _id: 'tx2', status: 'completed', amount: 200, platform: 'tiktok' },
          ],
          pagination: { total: 10 },
        },
      })),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: transactionService },
        { provide: AuthService, useValue: { user: jest.fn().mockReturnValue({ _id: '1', role: 'buyer' }), isAuthenticated: jest.fn().mockReturnValue(true) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(DashboardComponent, {
        set: { imports: [CommonModule, StatusLabelPipe, StatusColorPipe], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load data on init', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(transactionService.list).toHaveBeenCalled();
    expect(fixture.componentInstance.recentTransactions().length).toBe(2);
    expect(fixture.componentInstance.totalTransactions()).toBe(10);
    expect(fixture.componentInstance.pendingCount()).toBe(1);
    expect(fixture.componentInstance.completedCount()).toBe(1);
    expect(fixture.componentInstance.totalVolume()).toBe(300);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load data error', () => {
    transactionService.list.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should get platform icon for known platform', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance.getPlatformIcon('instagram')).toBe('photo_camera');
    expect(fixture.componentInstance.getPlatformIcon('tiktok')).toBe('music_video');
  });

  it('should return fallback icon for unknown platform', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance.getPlatformIcon('unknown')).toBe('language');
  });
});
