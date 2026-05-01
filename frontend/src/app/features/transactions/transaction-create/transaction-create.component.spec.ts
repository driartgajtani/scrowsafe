import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { TransactionCreateComponent } from './transaction-create.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';

describe('TransactionCreateComponent', () => {
  let transactionService: any;
  let router: Router;

  beforeEach(async () => {
    transactionService = {
      calculateFee: jest.fn().mockReturnValue(of({ success: true, data: { escrowFee: 25, totalToPay: 525 } })),
      create: jest.fn().mockReturnValue(of({ success: true, data: { transaction: { _id: 'newtx1' } } })),
    };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TransactionService, useValue: transactionService },
        { provide: AuthService, useValue: { user: jest.fn().mockReturnValue({ _id: '1', role: 'buyer' }) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TransactionCreateComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should calculate fee when platform and amount are set', fakeAsync(() => {
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.get('platform')?.setValue('instagram');
    comp.form.get('amount')?.setValue(500);
    tick(600);
    expect(transactionService.calculateFee).toHaveBeenCalledWith('instagram', 500);
    expect(comp.feeData()).toBeTruthy();
  }));

  it('should clear fee data when platform is empty', fakeAsync(() => {
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.get('platform')?.setValue('');
    comp.form.get('amount')?.setValue(500);
    tick(600);
    expect(comp.feeData()).toBeNull();
  }));

  it('should clear fee data when amount is less than 1', fakeAsync(() => {
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.get('platform')?.setValue('instagram');
    comp.form.get('amount')?.setValue(0);
    tick(600);
    expect(comp.feeData()).toBeNull();
  }));

  it('should handle fee calculation error', fakeAsync(() => {
    transactionService.calculateFee.mockReturnValue(throwError(() => new Error('err')));
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.get('platform')?.setValue('instagram');
    comp.form.get('amount')?.setValue(500);
    tick(600);
    expect(comp.feeData()).toBeNull();
  }));

  it('should not submit when form is invalid', () => {
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    fixture.componentInstance.onSubmit();
    expect(transactionService.create).not.toHaveBeenCalled();
  });

  it('should submit and navigate on success', () => {
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({
      role: 'buyer',
      counterpartyEmail: 'seller@test.com',
      platform: 'instagram',
      accountUsername: '',
      accountDescription: '',
      amount: 500,
      paymentMethod: 'crypto',
    });
    comp.onSubmit();
    expect(transactionService.create).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/transactions', 'newtx1']);
  });

  it('should handle create error', () => {
    transactionService.create.mockReturnValue(throwError(() => ({ error: { message: 'Create failed' } })));
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({
      role: 'buyer',
      counterpartyEmail: 'seller@test.com',
      platform: 'instagram',
      accountUsername: '',
      accountDescription: '',
      amount: 500,
      paymentMethod: 'crypto',
    });
    comp.onSubmit();
    expect(comp.error()).toBe('Create failed');
    expect(comp.loading()).toBe(false);
  });

  it('should default role to seller when user is seller', async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: TransactionService, useValue: transactionService },
        { provide: AuthService, useValue: { user: jest.fn().mockReturnValue({ _id: '1', role: 'seller' }) } },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).overrideComponent(TransactionCreateComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    }).compileComponents();

    const f = TestBed.createComponent(TransactionCreateComponent);
    expect(f.componentInstance.form.get('role')?.value).toBe('seller');
  });

  it('should show default create error', () => {
    transactionService.create.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(TransactionCreateComponent);
    const comp = fixture.componentInstance;
    comp.form.setValue({
      role: 'buyer',
      counterpartyEmail: 'seller@test.com',
      platform: 'instagram',
      accountUsername: 'user1',
      accountDescription: 'desc',
      amount: 500,
      paymentMethod: 'crypto',
    });
    comp.onSubmit();
    expect(comp.error()).toBe('Failed to create transaction.');
  });
});
