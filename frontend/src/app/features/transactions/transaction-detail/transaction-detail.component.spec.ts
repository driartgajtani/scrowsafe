import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { NO_ERRORS_SCHEMA, PLATFORM_ID } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionService } from '../../../core/services/transaction.service';
import { PaymentService } from '../../../core/services/payment.service';
import { DocumentService } from '../../../core/services/document.service';
import { WalletService } from '../../../core/services/wallet.service';
import { TidioService } from '../../../core/services/tidio.service';
import { AuthService } from '../../../core/services/auth.service';
import { of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';

jest.mock('@stripe/stripe-js', () => ({ loadStripe: jest.fn().mockResolvedValue(null) }));

const mockTx = {
  _id: 'txn1',
  buyerId: { _id: 'u1', name: 'Buyer', email: 'buyer@test.com' },
  sellerId: { _id: 'u2', name: 'Seller', email: 'seller@test.com' },
  status: 'pending',
  platform: 'instagram',
  amount: 500,
  totalToPay: 525,
  transactionId: 'TXN-001',
};

describe('TransactionDetailComponent', () => {
  let transactionService: any;
  let paymentService: any;
  let documentService: any;
  let walletService: any;
  let tidioService: any;
  let snackBar: any;
  let clipboard: any;

  beforeEach(async () => {
    transactionService = {
      getById: jest.fn().mockReturnValue(of({ success: true, data: { transaction: { ...mockTx } } })),
      submitCredentials: jest.fn().mockReturnValue(of({ success: true, data: { transaction: mockTx } })),
    };
    paymentService = {
      getStripe: jest.fn().mockResolvedValue(null),
      createPaymentIntent: jest.fn(),
      confirmPayment: jest.fn(),
      submitWirePayment: jest.fn().mockReturnValue(of({ success: true })),
      submitCryptoPayment: jest.fn().mockReturnValue(of({ success: true })),
    };
    documentService = {
      getByTransaction: jest.fn().mockReturnValue(of({ success: true, data: { documents: [] } })),
      upload: jest.fn().mockReturnValue(of({ success: true, data: { document: {} } })),
    };
    walletService = {
      getWallets: jest.fn().mockReturnValue(of({
        success: true,
        data: { wallets: [{ network: 'ethereum', label: 'ETH', address: '0xabc', explorer: 'https://etherscan.io' }] },
      })),
    };
    tidioService = { identify: jest.fn(), show: jest.fn(), load: jest.fn().mockResolvedValue(undefined) };
    snackBar = { open: jest.fn() };
    clipboard = { copy: jest.fn() };

    await TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'txn1' } } } },
        { provide: TransactionService, useValue: transactionService },
        { provide: PaymentService, useValue: paymentService },
        { provide: DocumentService, useValue: documentService },
        { provide: WalletService, useValue: walletService },
        { provide: TidioService, useValue: tidioService },
        { provide: AuthService, useValue: { user: jest.fn().mockReturnValue({ _id: 'u1', name: 'Test', role: 'buyer' }) } },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: Clipboard, useValue: clipboard },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      .overrideComponent(TransactionDetailComponent, {
        set: { imports: [], schemas: [NO_ERRORS_SCHEMA], template: '' },
      })
      .compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should load transaction, documents and wallets on init', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(transactionService.getById).toHaveBeenCalledWith('txn1');
    expect(documentService.getByTransaction).toHaveBeenCalledWith('txn1');
    expect(walletService.getWallets).toHaveBeenCalled();
    expect(fixture.componentInstance.tx()).toBeTruthy();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should handle load transaction error', () => {
    transactionService.getById.mockReturnValue(throwError(() => new Error('fail')));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('should load wallets and set default network', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.cryptoNetworks().length).toBe(1);
    expect(fixture.componentInstance.cryptoForm.get('network')?.value).toBe('ethereum');
  });

  it('should get selected network', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const net = fixture.componentInstance.selectedNetwork();
    expect(net?.value).toBe('ethereum');
  });

  it('should identify buyer correctly', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.isBuyer()).toBe(true);
    expect(fixture.componentInstance.isSeller()).toBe(false);
  });

  it('should get buyer and seller names', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.getBuyerName()).toBe('Buyer');
    expect(fixture.componentInstance.getBuyerEmail()).toBe('buyer@test.com');
    expect(fixture.componentInstance.getSellerName()).toBe('Seller');
    expect(fixture.componentInstance.getSellerEmail()).toBe('seller@test.com');
  });

  it('should return Unknown for string buyerId/sellerId', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.componentInstance.tx.set({ ...mockTx, buyerId: 'str', sellerId: 'str' } as any);
    expect(fixture.componentInstance.getBuyerName()).toBe('Unknown');
    expect(fixture.componentInstance.getBuyerEmail()).toBe('');
    expect(fixture.componentInstance.getSellerName()).toBe('Unknown');
    expect(fixture.componentInstance.getSellerEmail()).toBe('');
  });

  it('should show payment action for buyer with pending status', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.showPaymentAction()).toBe(true);
  });

  it('should not show payment action for seller', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.componentInstance.tx.set({ ...mockTx, buyerId: { _id: 'u999', name: 'Other', email: '' } } as any);
    expect(fixture.componentInstance.showPaymentAction()).toBe(false);
  });

  it('should show credentials action for seller with payment_received', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.componentInstance.tx.set({
      ...mockTx,
      sellerId: { _id: 'u1', name: 'Test', email: 'test@test.com' },
      status: 'payment_received',
    } as any);
    expect(fixture.componentInstance.showCredentialsAction()).toBe(true);
  });

  it('should submit wire payment', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.wireForm.setValue({ referenceNumber: 'WR123' });
    comp.submitWirePayment();
    expect(paymentService.submitWirePayment).toHaveBeenCalledWith('txn1', 'WR123');
    expect(snackBar.open).toHaveBeenCalledWith('Wire payment details submitted', 'Close', expect.any(Object));
  });

  it('should not submit wire payment when form is invalid', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.submitWirePayment();
    expect(paymentService.submitWirePayment).not.toHaveBeenCalled();
  });

  it('should handle wire payment error', () => {
    paymentService.submitWirePayment.mockReturnValue(throwError(() => ({ error: { message: 'Wire fail' } })));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.wireForm.setValue({ referenceNumber: 'WR123' });
    comp.submitWirePayment();
    expect(snackBar.open).toHaveBeenCalledWith('Wire fail', 'Close', expect.any(Object));
  });

  it('should show default wire payment error', () => {
    paymentService.submitWirePayment.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.wireForm.setValue({ referenceNumber: 'WR123' });
    comp.submitWirePayment();
    expect(snackBar.open).toHaveBeenCalledWith('Submission failed', 'Close', expect.any(Object));
  });

  it('should submit crypto payment', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.cryptoForm.setValue({ txHash: '0xhash', network: 'ethereum' });
    comp.submitCryptoPayment();
    expect(paymentService.submitCryptoPayment).toHaveBeenCalledWith('txn1', '0xhash', 'ethereum');
    expect(snackBar.open).toHaveBeenCalledWith('Crypto payment details submitted', 'Close', expect.any(Object));
  });

  it('should not submit crypto payment when form is invalid', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.cryptoForm.get('txHash')?.setValue('');
    fixture.componentInstance.submitCryptoPayment();
    expect(paymentService.submitCryptoPayment).not.toHaveBeenCalled();
  });

  it('should handle crypto payment error', () => {
    paymentService.submitCryptoPayment.mockReturnValue(throwError(() => ({ error: { message: 'Crypto fail' } })));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.cryptoForm.setValue({ txHash: '0xhash', network: 'ethereum' });
    comp.submitCryptoPayment();
    expect(snackBar.open).toHaveBeenCalledWith('Crypto fail', 'Close', expect.any(Object));
  });

  it('should show default crypto payment error', () => {
    paymentService.submitCryptoPayment.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.cryptoForm.setValue({ txHash: '0xhash', network: 'ethereum' });
    comp.submitCryptoPayment();
    expect(snackBar.open).toHaveBeenCalledWith('Submission failed', 'Close', expect.any(Object));
  });

  it('should submit credentials', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.credentialsForm.setValue({ credentials: 'user:pass', payoutInfo: 'paypal', recoveryEmail: 'r@test.com' });
    comp.submitCredentials();
    expect(transactionService.submitCredentials).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith('Credentials submitted securely', 'Close', expect.any(Object));
  });

  it('should not submit credentials when form is invalid', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.submitCredentials();
    expect(transactionService.submitCredentials).not.toHaveBeenCalled();
  });

  it('should handle submit credentials error', () => {
    transactionService.submitCredentials.mockReturnValue(throwError(() => ({ error: { message: 'Cred fail' } })));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.credentialsForm.setValue({ credentials: 'user:pass', payoutInfo: 'paypal', recoveryEmail: '' });
    comp.submitCredentials();
    expect(snackBar.open).toHaveBeenCalledWith('Cred fail', 'Close', expect.any(Object));
  });

  it('should show default credentials error', () => {
    transactionService.submitCredentials.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const comp = fixture.componentInstance;
    comp.credentialsForm.setValue({ credentials: 'user:pass', payoutInfo: 'paypal', recoveryEmail: '' });
    comp.submitCredentials();
    expect(snackBar.open).toHaveBeenCalledWith('Submission failed', 'Close', expect.any(Object));
  });

  it('should upload document', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as any;
    fixture.componentInstance.uploadDocument(event);
    expect(documentService.upload).toHaveBeenCalledWith('txn1', file);
    expect(snackBar.open).toHaveBeenCalledWith('Document uploaded', 'Close', expect.any(Object));
  });

  it('should not upload when no file selected', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const event = { target: { files: [] } } as any;
    fixture.componentInstance.uploadDocument(event);
    expect(documentService.upload).not.toHaveBeenCalled();
  });

  it('should handle upload error', () => {
    documentService.upload.mockReturnValue(throwError(() => ({ error: { message: 'Upload fail' } })));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    fixture.componentInstance.uploadDocument({ target: { files: [file] } } as any);
    expect(snackBar.open).toHaveBeenCalledWith('Upload fail', 'Close', expect.any(Object));
  });

  it('should show default upload error', () => {
    documentService.upload.mockReturnValue(throwError(() => ({})));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    fixture.componentInstance.uploadDocument({ target: { files: [file] } } as any);
    expect(snackBar.open).toHaveBeenCalledWith('Upload failed', 'Close', expect.any(Object));
  });

  it('should build document URL', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    const url = fixture.componentInstance.getDocumentUrl({ fileUrl: '/uploads/doc.pdf' } as any);
    expect(url).toContain('/uploads/doc.pdf');
  });

  it('should copy wallet address', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    fixture.componentInstance.copyWallet();
    expect(clipboard.copy).toHaveBeenCalledWith('0xabc');
    expect(snackBar.open).toHaveBeenCalledWith('Wallet address copied!', 'Close', expect.any(Object));
  });

  it('should not copy when no network selected', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.componentInstance.cryptoNetworks.set([]);
    fixture.componentInstance.copyWallet();
    expect(clipboard.copy).not.toHaveBeenCalled();
  });

  it('should handle empty wallets response', () => {
    walletService.getWallets.mockReturnValue(of({ success: true, data: { wallets: [] } }));
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.cryptoNetworks().length).toBe(0);
  });

  it('should format file size', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    expect(fixture.componentInstance.formatFileSize(500)).toBe('500 B');
    expect(fixture.componentInstance.formatFileSize(1024)).toBe('1.0 KB');
    expect(fixture.componentInstance.formatFileSize(1048576)).toBe('1.0 MB');
  });

  it('should open chat with tidio', async () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.openChat();
    expect(tidioService.load).toHaveBeenCalled();
    expect(tidioService.identify).toHaveBeenCalled();
    expect(tidioService.show).toHaveBeenCalled();
  });

  it('should not open chat when no transaction', async () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.componentInstance.tx.set(null);
    await fixture.componentInstance.openChat();
    expect(tidioService.load).not.toHaveBeenCalled();
  });

  it('should handle stripe payment when stripe is null', async () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();
    expect(snackBar.open).toHaveBeenCalledWith('Failed to load payment processor', 'Close', expect.any(Object));
  });

  it('should initiate stripe payment and confirm successfully', async () => {
    const mockStripe = {
      confirmCardPayment: jest.fn().mockResolvedValue({ error: null }),
      elements: jest.fn().mockReturnValue({ create: jest.fn().mockReturnValue({}) }),
    };
    paymentService.getStripe.mockResolvedValue(mockStripe);
    paymentService.createPaymentIntent.mockReturnValue(of({
      success: true,
      data: { clientSecret: 'cs_test', paymentIntentId: 'pi_test' },
    }));
    paymentService.confirmPayment.mockReturnValue(of({ success: true }));

    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(mockStripe.confirmCardPayment).toHaveBeenCalled();
    expect(paymentService.confirmPayment).toHaveBeenCalledWith('pi_test');
  });

  it('should handle stripe confirmCardPayment error', async () => {
    const mockStripe = {
      confirmCardPayment: jest.fn().mockResolvedValue({ error: { message: 'Card declined' } }),
      elements: jest.fn().mockReturnValue({ create: jest.fn().mockReturnValue({}) }),
    };
    paymentService.getStripe.mockResolvedValue(mockStripe);
    paymentService.createPaymentIntent.mockReturnValue(of({
      success: true,
      data: { clientSecret: 'cs_test', paymentIntentId: 'pi_test' },
    }));

    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(snackBar.open).toHaveBeenCalledWith('Card declined', 'Close', expect.any(Object));
  });

  it('should handle createPaymentIntent error', async () => {
    const mockStripe = { confirmCardPayment: jest.fn(), elements: jest.fn() };
    paymentService.getStripe.mockResolvedValue(mockStripe);
    paymentService.createPaymentIntent.mockReturnValue(throwError(() => ({ error: { message: 'Intent failed' } })));

    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();

    expect(snackBar.open).toHaveBeenCalledWith('Intent failed', 'Close', expect.any(Object));
  });

  it('should show default createPaymentIntent error', async () => {
    const mockStripe = { confirmCardPayment: jest.fn(), elements: jest.fn() };
    paymentService.getStripe.mockResolvedValue(mockStripe);
    paymentService.createPaymentIntent.mockReturnValue(throwError(() => ({})));

    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();

    expect(snackBar.open).toHaveBeenCalledWith('Failed to create payment', 'Close', expect.any(Object));
  });

  it('should handle confirmCardPayment with default error message', async () => {
    const mockStripe = {
      confirmCardPayment: jest.fn().mockResolvedValue({ error: {} }),
      elements: jest.fn().mockReturnValue({ create: jest.fn().mockReturnValue({}) }),
    };
    paymentService.getStripe.mockResolvedValue(mockStripe);
    paymentService.createPaymentIntent.mockReturnValue(of({
      success: true,
      data: { clientSecret: 'cs_test', paymentIntentId: 'pi_test' },
    }));

    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(snackBar.open).toHaveBeenCalledWith('Payment failed', 'Close', expect.any(Object));
  });

  it('should handle confirmPayment error', async () => {
    const mockStripe = {
      confirmCardPayment: jest.fn().mockResolvedValue({ error: null }),
      elements: jest.fn().mockReturnValue({ create: jest.fn().mockReturnValue({}) }),
    };
    paymentService.getStripe.mockResolvedValue(mockStripe);
    paymentService.createPaymentIntent.mockReturnValue(of({
      success: true,
      data: { clientSecret: 'cs_test', paymentIntentId: 'pi_test' },
    }));
    paymentService.confirmPayment.mockReturnValue(throwError(() => new Error('confirm err')));

    const fixture = TestBed.createComponent(TransactionDetailComponent);
    fixture.detectChanges();
    await fixture.componentInstance.initiateStripePayment();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(fixture.componentInstance.actionLoading()).toBe(false);
  });

  it('should not do anything on ngOnDestroy', () => {
    const fixture = TestBed.createComponent(TransactionDetailComponent);
    expect(() => fixture.componentInstance.ngOnDestroy()).not.toThrow();
  });
});
