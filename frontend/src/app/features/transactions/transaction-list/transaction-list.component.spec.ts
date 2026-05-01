import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { of, throwError } from 'rxjs';

describe('TransactionListComponent', () => {
  let transactionService: any;

  beforeEach(async () => {
    transactionService = {
      list: jest.fn().mockReturnValue(of({
        success: true,
        data: {
          transactions: [{ _id: 'tx1', platform: 'instagram', amount: 500, escrowFee: 25, totalToPay: 525, status: 'pending', createdAt: '2025-01-01T00:00:00Z', transactionId: 'TXN-001' }],
          pagination: { page: 1, limit: 10, total: 1, pages: 1 },
        },
      })),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: transactionService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TransactionListComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA], template: '' },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load transactions on init', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    expect(transactionService.list).toHaveBeenCalled();
    expect(fixture.componentInstance.transactions().length).toBe(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load error', () => {
    transactionService.list.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should get platform icon for known platform', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    expect(fixture.componentInstance.getPlatformIcon('tiktok')).toBe('music_video');
  });

  it('should return fallback icon for unknown platform', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    expect(fixture.componentInstance.getPlatformIcon('myspace')).toBe('language');
  });

  it('should apply filters', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    transactionService.list.mockClear();
    fixture.componentInstance.filterStatus = 'completed';
    fixture.componentInstance.applyFilters();
    expect(transactionService.list).toHaveBeenCalled();
  });

  it('should handle page change', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    transactionService.list.mockClear();
    fixture.componentInstance.onPageChange({ pageIndex: 2, pageSize: 20, length: 50 } as any);
    expect(transactionService.list).toHaveBeenCalled();
  });

  it('should include filterPlatform in query', () => {
    const fixture = TestBed.createComponent(TransactionListComponent);
    fixture.detectChanges();
    transactionService.list.mockClear();
    fixture.componentInstance.filterPlatform = 'instagram';
    fixture.componentInstance.applyFilters();
    expect(transactionService.list).toHaveBeenCalled();
  });
});
