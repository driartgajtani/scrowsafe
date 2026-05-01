import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminService } from '../../../core/services/admin.service';
import { of, throwError } from 'rxjs';

describe('AdminDashboardComponent', () => {
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      getDashboard: jest.fn().mockReturnValue(of({
        success: true,
        data: { totalUsers: 10, totalTransactions: 50, pendingTransactions: 5, completedTransactions: 40, totalRevenue: 5000, totalVolume: 100000 },
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
      .overrideComponent(AdminDashboardComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    expect(adminService.getDashboard).toHaveBeenCalled();
    expect(fixture.componentInstance.stats()).toBeTruthy();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle dashboard load error', () => {
    adminService.getDashboard.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });
});
