import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminTransactionDetailComponent } from './admin-transaction-detail.component';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

const mockTx = {
  _id: 'txn1',
  transactionId: 'TXN-001',
  buyerId: { _id: 'u1', name: 'Buyer', email: 'buyer@test.com' },
  sellerId: { _id: 'u2', name: 'Seller', email: 'seller@test.com' },
  status: 'pending',
  platform: 'instagram',
  amount: 500,
  escrowFee: 25,
  totalToPay: 525,
  paymentMethod: 'crypto',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('AdminTransactionDetailComponent', () => {
  let adminService: any;
  let snackBar: any;

  beforeEach(async () => {
    adminService = {
      getTransactionDetail: jest.fn().mockReturnValue(of({
        success: true,
        data: { transaction: { ...mockTx }, payments: [], documents: [] },
      })),
      updateTransactionStatus: jest.fn().mockReturnValue(of({
        success: true,
        data: { transaction: { ...mockTx, status: 'completed' } },
      })),
      releaseFunds: jest.fn().mockReturnValue(of({ success: true })),
      refundTransaction: jest.fn().mockReturnValue(of({ success: true })),
    };
    snackBar = { open: jest.fn() };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => 'txn1' } } },
        },
        { provide: AdminService, useValue: adminService },
        { provide: AuthService, useValue: { user: jest.fn().mockReturnValue({ _id: 'admin1', role: 'admin' }) } },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(AdminTransactionDetailComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA], template: '' },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load detail on init', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    expect(adminService.getTransactionDetail).toHaveBeenCalledWith('txn1');
    expect(fixture.componentInstance.tx()).toBeTruthy();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load detail error', () => {
    adminService.getTransactionDetail.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should get buyer name', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.getBuyerName()).toBe('Buyer');
  });

  it('should get buyer email', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.getBuyerEmail()).toBe('buyer@test.com');
  });

  it('should get seller name', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.getSellerName()).toBe('Seller');
  });

  it('should get seller email', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.getSellerEmail()).toBe('seller@test.com');
  });

  it('should return Unknown for string buyerId', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.componentInstance.tx.set({ ...mockTx, buyerId: 'u1', sellerId: 'u2' } as any);
    expect(fixture.componentInstance.getBuyerName()).toBe('Unknown');
    expect(fixture.componentInstance.getBuyerEmail()).toBe('');
    expect(fixture.componentInstance.getSellerName()).toBe('Unknown');
    expect(fixture.componentInstance.getSellerEmail()).toBe('');
  });

  it('should update status successfully', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.statusForm.setValue({ status: 'completed', adminNotes: 'done' });
    fixture.componentInstance.updateStatus();
    expect(adminService.updateTransactionStatus).toHaveBeenCalledWith('txn1', 'completed', 'done');
    expect(snackBar.open).toHaveBeenCalledWith('Status updated', 'Close', expect.any(Object));
    expect(fixture.componentInstance.actionLoading()).toBe(false);
  });

  it('should not update status when form is invalid', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.statusForm.setValue({ status: '', adminNotes: '' });
    fixture.componentInstance.updateStatus();
    expect(adminService.updateTransactionStatus).not.toHaveBeenCalled();
  });

  it('should handle update status error', () => {
    adminService.updateTransactionStatus.mockReturnValue(throwError(() => ({ error: { message: 'err' } })));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.statusForm.setValue({ status: 'completed', adminNotes: '' });
    fixture.componentInstance.updateStatus();
    expect(snackBar.open).toHaveBeenCalledWith('err', 'Close', expect.any(Object));
  });

  it('should show default error on status update failure', () => {
    adminService.updateTransactionStatus.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.statusForm.setValue({ status: 'completed', adminNotes: '' });
    fixture.componentInstance.updateStatus();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to update', 'Close', expect.any(Object));
  });

  it('should release funds successfully', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.releaseFunds();
    expect(adminService.releaseFunds).toHaveBeenCalledWith('txn1');
    expect(snackBar.open).toHaveBeenCalledWith('Funds released successfully', 'Close', expect.any(Object));
  });

  it('should handle release funds error', () => {
    adminService.releaseFunds.mockReturnValue(throwError(() => ({ error: { message: 'rel err' } })));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.releaseFunds();
    expect(snackBar.open).toHaveBeenCalledWith('rel err', 'Close', expect.any(Object));
  });

  it('should show default error on release failure', () => {
    adminService.releaseFunds.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.releaseFunds();
    expect(snackBar.open).toHaveBeenCalledWith('Release failed', 'Close', expect.any(Object));
  });

  it('should refund transaction successfully', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.refundReason = 'Reason';
    fixture.componentInstance.refundTransaction();
    expect(adminService.refundTransaction).toHaveBeenCalledWith('txn1', 'Reason');
    expect(snackBar.open).toHaveBeenCalledWith('Transaction refunded', 'Close', expect.any(Object));
  });

  it('should handle refund error', () => {
    adminService.refundTransaction.mockReturnValue(throwError(() => ({ error: { message: 'ref err' } })));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.refundTransaction();
    expect(snackBar.open).toHaveBeenCalledWith('ref err', 'Close', expect.any(Object));
  });

  it('should show default error on refund failure', () => {
    adminService.refundTransaction.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.refundTransaction();
    expect(snackBar.open).toHaveBeenCalledWith('Refund failed', 'Close', expect.any(Object));
  });

  it('should format file size in bytes', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    expect(fixture.componentInstance.formatFileSize(500)).toBe('500 B');
    expect(fixture.componentInstance.formatFileSize(2048)).toBe('2.0 KB');
    expect(fixture.componentInstance.formatFileSize(2097152)).toBe('2.0 MB');
  });

  it('should build document URL', () => {
    const fixture = TestBed.createComponent(AdminTransactionDetailComponent);
    const url = fixture.componentInstance.getDocumentUrl({ fileUrl: '/uploads/doc.pdf' } as any);
    expect(url).toContain('/uploads/doc.pdf');
  });
});
