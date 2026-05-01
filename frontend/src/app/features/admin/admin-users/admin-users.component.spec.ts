import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { AdminUsersComponent } from './admin-users.component';
import { AdminService } from '../../../core/services/admin.service';
import { of, throwError } from 'rxjs';

describe('AdminUsersComponent', () => {
  let adminService: any;

  beforeEach(async () => {
    adminService = {
      getUsers: jest.fn().mockReturnValue(of({
        success: true,
        data: { users: [{ _id: 'u1', name: 'Test' }], pagination: { page: 1, limit: 10, total: 1, pages: 1 } },
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
      .overrideComponent(AdminUsersComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load users on init', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    expect(adminService.getUsers).toHaveBeenCalled();
    expect(fixture.componentInstance.users().length).toBe(1);
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load error', () => {
    adminService.getUsers.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle page change', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.detectChanges();
    adminService.getUsers.mockClear();
    fixture.componentInstance.onPageChange({ pageIndex: 1, pageSize: 25, length: 50 } as any);
    expect(adminService.getUsers).toHaveBeenCalledWith(2, 25, undefined);
  });

  it('should pass filterRole to loadUsers', () => {
    const fixture = TestBed.createComponent(AdminUsersComponent);
    fixture.componentInstance.filterRole = 'admin';
    fixture.componentInstance.loadUsers();
    expect(adminService.getUsers).toHaveBeenCalledWith(1, 10, 'admin');
  });
});
