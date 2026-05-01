const mongoose = require('mongoose');
const env = require('../../src/config/env');
const paymentController = require('../../src/controllers/paymentController');
const Transaction = require('../../src/models/Transaction');
const PaymentRecord = require('../../src/models/PaymentRecord');

jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/PaymentRecord');
jest.mock('stripe', () => {
  const mock = {
    paymentIntents: {
      create: jest.fn().mockResolvedValue({ id: 'pi_test', client_secret: 'cs_test' }),
      retrieve: jest.fn().mockResolvedValue({ id: 'pi_test', status: 'requires_capture' }),
      capture: jest.fn().mockResolvedValue({}),
      cancel: jest.fn().mockResolvedValue({}),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };
  const StripeMock = jest.fn(() => mock);
  StripeMock.__mock = mock;
  return StripeMock;
});

describe('Payment Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      headers: {},
      user: { _id: new mongoose.Types.ObjectId() },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should return 400 if stripe is disabled', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => key === 'STRIPE_ENABLED' ? false : env.getAll()[key]);
      req.params = { transactionId: 'txn1' };
      await paymentController.createPaymentIntent(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      env.get.mockRestore();
    });

    it('should return 404 if transaction not found', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => key === 'STRIPE_ENABLED' ? true : env.getAll()[key]);
      req.params = { transactionId: 'txn1' };
      Transaction.findOne.mockResolvedValue(null);
      await paymentController.createPaymentIntent(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      env.get.mockRestore();
    });

    it('should create payment intent successfully', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => key === 'STRIPE_ENABLED' ? true : env.getAll()[key]);
      req.params = { transactionId: 'txn1' };
      Transaction.findOne.mockResolvedValue({
        _id: 'txn1',
        totalToPay: 525,
        transactionId: 'TXN-ABC',
        platform: 'instagram',
      });
      PaymentRecord.create.mockResolvedValue({});

      await paymentController.createPaymentIntent(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      env.get.mockRestore();
    });

    it('should call next on error', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => key === 'STRIPE_ENABLED' ? true : env.getAll()[key]);
      req.params = { transactionId: 'txn1' };
      Transaction.findOne.mockRejectedValue(new Error('DB error'));
      await paymentController.createPaymentIntent(req, res, next);
      expect(next).toHaveBeenCalled();
      env.get.mockRestore();
    });
  });

  describe('confirmPayment', () => {
    it('should return 404 if payment record not found', async () => {
      req.body = { paymentIntentId: 'pi_test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await paymentController.confirmPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 404 if transaction not found', async () => {
      req.body = { paymentIntentId: 'pi_test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue({ transactionId: 'txn1' }) });
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await paymentController.confirmPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should confirm payment with requires_capture status', async () => {
      req.body = { paymentIntentId: 'pi_test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockPayment = { transactionId: 'txn1', status: 'pending', save: jest.fn() };
      const mockTxn = { _id: 'txn1', status: 'pending', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });

      await paymentController.confirmPayment(req, res, next);
      expect(mockPayment.status).toBe('held');
      expect(mockTxn.status).toBe('payment_received');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle failed payment status', async () => {
      req.body = { paymentIntentId: 'pi_test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockPayment = { transactionId: 'txn1', status: 'pending', save: jest.fn() };
      const mockTxn = { _id: 'txn1' };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });

      const Stripe = require('stripe');
      Stripe.__mock.paymentIntents.retrieve.mockResolvedValueOnce({ id: 'pi_test', status: 'canceled' });

      await paymentController.confirmPayment(req, res, next);
      expect(mockPayment.status).toBe('failed');
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should call next on error and abort transaction', async () => {
      req.body = { paymentIntentId: 'pi_test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockRejectedValue(new Error('DB error')) });

      await paymentController.confirmPayment(req, res, next);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('recordWirePayment', () => {
    it('should return 404 if transaction not found', async () => {
      req.body = { transactionId: 'txn1', referenceNumber: 'REF123' };
      Transaction.findOne.mockResolvedValue(null);
      await paymentController.recordWirePayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should record wire payment', async () => {
      req.body = { transactionId: 'txn1', referenceNumber: 'REF123' };
      Transaction.findOne.mockResolvedValue({ _id: 'txn1', totalToPay: 525 });
      PaymentRecord.create.mockResolvedValue({});
      await paymentController.recordWirePayment(req, res, next);
      expect(PaymentRecord.create).toHaveBeenCalledWith(expect.objectContaining({ method: 'wire' }));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.body = { transactionId: 'txn1', referenceNumber: 'REF123' };
      Transaction.findOne.mockRejectedValue(new Error('DB error'));
      await paymentController.recordWirePayment(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('recordCryptoPayment', () => {
    it('should return 404 if transaction not found', async () => {
      req.body = { transactionId: 'txn1', txHash: '0xabc', network: 'bitcoin' };
      Transaction.findOne.mockResolvedValue(null);
      await paymentController.recordCryptoPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should record crypto payment', async () => {
      req.body = { transactionId: 'txn1', txHash: '0xabc', network: 'bitcoin' };
      Transaction.findOne.mockResolvedValue({ _id: 'txn1', totalToPay: 525 });
      PaymentRecord.create.mockResolvedValue({});
      await paymentController.recordCryptoPayment(req, res, next);
      expect(PaymentRecord.create).toHaveBeenCalledWith(expect.objectContaining({ method: 'crypto' }));
    });

    it('should call next on error', async () => {
      req.body = { transactionId: 'txn1', txHash: '0xabc', network: 'bitcoin' };
      Transaction.findOne.mockRejectedValue(new Error('DB error'));
      await paymentController.recordCryptoPayment(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('stripeWebhook', () => {
    let stripeMock;

    beforeEach(() => {
      stripeMock = require('stripe').__mock;
      jest.spyOn(console, 'log').mockImplementation(() => {});
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      console.log.mockRestore();
      console.error.mockRestore();
    });

    it('should return 400 if signature verification fails', async () => {
      req.headers = { 'stripe-signature': 'invalid' };
      req.body = Buffer.from('{}');
      stripeMock.webhooks.constructEvent.mockImplementation(() => { throw new Error('Invalid sig'); });

      await paymentController.stripeWebhook(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return received:true for payment_intent.succeeded', async () => {
      req.headers = { 'stripe-signature': 'valid' };
      req.body = Buffer.from('{}');
      stripeMock.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_test' } },
      });

      await paymentController.stripeWebhook(req, res);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle payment_intent.payment_failed event', async () => {
      req.headers = { 'stripe-signature': 'valid' };
      req.body = Buffer.from('{}');
      stripeMock.webhooks.constructEvent.mockReturnValue({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_failed' } },
      });

      await paymentController.stripeWebhook(req, res);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });

    it('should handle unhandled event type', async () => {
      req.headers = { 'stripe-signature': 'valid' };
      req.body = Buffer.from('{}');
      stripeMock.webhooks.constructEvent.mockReturnValue({
        type: 'customer.created',
        data: { object: { id: 'cus_test' } },
      });

      await paymentController.stripeWebhook(req, res);
      expect(res.json).toHaveBeenCalledWith({ received: true });
    });
  });
});
