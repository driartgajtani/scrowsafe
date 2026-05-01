import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { AdminTransactionsComponent } from './admin-transactions.component';
import { AdminService } from '../../../core/services/admin.service';
import { of, throwError } from 'rxjs';

describe('AdminTransactionsComponent', () => {
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      getTransactions: jest.fn().mockReturnValue(of({
        success: true,
        data: { transactions: [{ _id: 'tx1' }], pagination: { page: 1, limit: 10, total: 1, pages: 1 } },
      })),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AdminService, useValue: adminService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AdminTransactionsComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminTransactionsComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load transactions on init', () => {
    const fixture = TestBed.createComponent(AdminTransactionsComponent);
    fixture.detectChanges();
    expect(adminService.getTransactions).toHaveBeenCalledWith(1, 10);
    expect(fixture.componentInstance.transactions().length).toBe(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load error', () => {
    adminService.getTransactions.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(AdminTransactionsComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle page change', () => {
    const fixture = TestBed.createComponent(AdminTransactionsComponent);
    fixture.detectChanges();
    adminService.getTransactions.mockClear();
    fixture.componentInstance.onPageChange({ pageIndex: 2, pageSize: 20, length: 100 } as any);
    expect(adminService.getTransactions).toHaveBeenCalledWith(3, 20);
  });
});
