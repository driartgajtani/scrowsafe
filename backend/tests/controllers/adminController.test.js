const mongoose = require('mongoose');
const adminController = require('../../src/controllers/adminController');
const Transaction = require('../../src/models/Transaction');
const PaymentRecord = require('../../src/models/PaymentRecord');
const User = require('../../src/models/User');
const Document = require('../../src/models/Document');

jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/PaymentRecord');
jest.mock('../../src/models/User');
jest.mock('../../src/models/Document');
jest.mock('../../src/utils/encryption', () => ({
  decrypt: jest.fn((val) => decrypted_${val}),
  encrypt: jest.fn((val) => encrypted_${val}),
}));
jest.mock('stripe', () => {
  const mock = {
    paymentIntents: {
      capture: jest.fn().mockResolvedValue({}),
      cancel: jest.fn().mockResolvedValue({}),
    },
  };
  const StripeMock = jest.fn(() => mock);
  StripeMock.__mock = mock;
  return StripeMock;
});

describe('Admin Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getAllTransactions', () => {
    it('should return paginated transactions', async () => {
      req.query = { page: 1, limit: 20, sort: '-createdAt' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(0);

      await adminController.getAllTransactions(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by status', async () => {
      req.query = { status: 'pending' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(0);

      await adminController.getAllTransactions(req, res, next);
      expect(Transaction.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('should filter by platform', async () => {
      req.query = { platform: 'instagram' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(0);

      await adminController.getAllTransactions(req, res, next);
      expect(Transaction.find).toHaveBeenCalledWith(expect.objectContaining({ platform: 'instagram' }));
    });

    it('should handle ascending sort', async () => {
      req.query = { sort: 'createdAt' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(0);

      await adminController.getAllTransactions(req, res, next);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 1 });
    });

    it('should call next on error', async () => {
      req.query = {};
      Transaction.find.mockImplementation(() => { throw new Error('DB error'); });
      await adminController.getAllTransactions(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getTransactionDetail', () => {
    it('should return 404 if not found', async () => {
      req.params = { id: 'txn1' };
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });
      await adminController.getTransactionDetail(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return transaction with payments and documents', async () => {
      req.params = { id: 'txn1' };
      const mockTxn = {
        toObject: () => ({ _id: 'txn1', sellerCredentials: null, sellerRecoveryEmail: null, sellerPayoutInfo: null }),
        sellerCredentials: null,
        sellerRecoveryEmail: null,
        sellerPayoutInfo: null,
        _id: 'txn1',
      };
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });
      PaymentRecord.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      Document.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      await adminController.getTransactionDetail(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should decrypt credentials when present', async () => {
      req.params = { id: 'txn1' };
      const mockTxn = {
        toObject: () => ({
          _id: 'txn1',
          sellerCredentials: 'encrypted_creds',
          sellerRecoveryEmail: 'encrypted_email',
          sellerPayoutInfo: 'encrypted_payout',
        }),
        sellerCredentials: 'encrypted_creds',
        sellerRecoveryEmail: 'encrypted_email',
        sellerPayoutInfo: 'encrypted_payout',
        _id: 'txn1',
      };
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });
      PaymentRecord.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });
      Document.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([]) });

      await adminController.getTransactionDetail(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.params = { id: 'txn1' };
      Transaction.findById.mockImplementation(() => { throw new Error('DB error'); });
      await adminController.getTransactionDetail(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateTransactionStatus', () => {
    it('should return 404 if transaction not found', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'completed' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await adminController.updateTransactionStatus(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should update status to completed', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'completed' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { status: 'pending', progressStep: 1, adminNotes: '', save: jest.fn(), _id: 'txn1' };
      Transaction.findById.mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockTxn) });
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });

      await adminController.updateTransactionStatus(req, res, next);
      expect(mockTxn.status).toBe('completed');
      expect(mockTxn.completedAt).toBeDefined();
      expect(mockTxn.buyerCredentialsReceived).toBe(true);
    });

    it('should update status to refunded with refundReason', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'refunded', refundReason: 'fraud' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { status: 'pending', progressStep: 2, adminNotes: '', save: jest.fn(), _id: 'txn1' };
      Transaction.findById.mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockTxn) });
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });

      await adminController.updateTransactionStatus(req, res, next);
      expect(mockTxn.status).toBe('refunded');
      expect(mockTxn.refundedAt).toBeDefined();
      expect(mockTxn.refundReason).toBe('fraud');
    });

    it('should default refundReason to empty string when not provided', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'refunded' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { status: 'pending', progressStep: 2, adminNotes: '', save: jest.fn(), _id: 'txn1' };
      Transaction.findById.mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockTxn) });
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });

      await adminController.updateTransactionStatus(req, res, next);
      expect(mockTxn.refundReason).toBe('');
    });

    it('should update with adminNotes', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'pending', adminNotes: 'updated by admin' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { status: 'pending', progressStep: 1, adminNotes: 'existing note', save: jest.fn(), _id: 'txn1' };
      Transaction.findById.mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockTxn) });
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });

      await adminController.updateTransactionStatus(req, res, next);
      expect(mockTxn.adminNotes).toContain('updated by admin');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should handle unknown status gracefully', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'unknown_status' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { status: 'pending', progressStep: 2, adminNotes: '', save: jest.fn(), _id: 'txn1' };
      Transaction.findById.mockReturnValueOnce({ session: jest.fn().mockResolvedValue(mockTxn) });
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });

      await adminController.updateTransactionStatus(req, res, next);
      expect(mockTxn.progressStep).toBe(2);
    });

    it('should call next on error and abort transaction', async () => {
      req.params = { id: 'txn1' };
      req.body = { status: 'completed' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({
        session: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await adminController.updateTransactionStatus(req, res, next);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('releaseFunds', () => {
    it('should return 404 if transaction not found', async () => {
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await adminController.releaseFunds(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if transaction not completed', async () => {
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ status: 'pending' }) });

      await adminController.releaseFunds(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if no held payment found', async () => {
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'txn1', status: 'completed' }) });
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await adminController.releaseFunds(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should release funds successfully for stripe', async () => {
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'txn1', status: 'completed' }) });
      const mockPayment = { method: 'stripe', stripePaymentIntentId: 'pi_test', status: 'held', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });

      await adminController.releaseFunds(req, res, next);
      expect(mockPayment.status).toBe('released');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should release funds for non-stripe payment', async () => {
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'txn1', status: 'completed' }) });
      const mockPayment = { method: 'crypto', status: 'held', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });

      await adminController.releaseFunds(req, res, next);
      expect(mockPayment.status).toBe('released');
    });

    it('should still release funds when stripe capture fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'txn1', status: 'completed' }) });
      const mockPayment = { method: 'stripe', stripePaymentIntentId: 'pi_test', status: 'held', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });

      const Stripe = require('stripe');
      Stripe.__mock.paymentIntents.capture.mockRejectedValueOnce(new Error('Stripe capture failed'));

      await adminController.releaseFunds(req, res, next);
      expect(console.error).toHaveBeenCalledWith('Stripe capture error:', 'Stripe capture failed');
      expect(mockPayment.status).toBe('released');
      expect(res.status).toHaveBeenCalledWith(200);
      console.error.mockRestore();
    });

    it('should call next on error and abort transaction', async () => {
      req.params = { id: 'txn1' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({
        session: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      await adminController.releaseFunds(req, res, next);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('refundPayment', () => {
    it('should return 404 if transaction not found', async () => {
      req.params = { id: 'txn1' };
      req.body = { reason: 'test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await adminController.refundPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 if no held payment found', async () => {
      req.params = { id: 'txn1' };
      req.body = { reason: 'test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue({ _id: 'txn1' }) });
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await adminController.refundPayment(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should refund stripe payment successfully', async () => {
      req.params = { id: 'txn1' };
      req.body = { reason: 'buyer requested' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { _id: 'txn1', status: 'pending', save: jest.fn() };
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });
      const mockPayment = { method: 'stripe', stripePaymentIntentId: 'pi_test', status: 'held', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });

      await adminController.refundPayment(req, res, next);
      expect(mockPayment.status).toBe('refunded');
      expect(mockTxn.status).toBe('refunded');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should refund non-stripe payment', async () => {
      req.params = { id: 'txn1' };
      req.body = {};
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { _id: 'txn1', save: jest.fn() };
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });
      const mockPayment = { method: 'crypto', status: 'held', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });

      await adminController.refundPayment(req, res, next);
      expect(mockTxn.refundReason).toBe('Admin initiated refund');
    });

    it('should still refund when stripe cancel fails', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      req.params = { id: 'txn1' };
      req.body = { reason: 'test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      const mockTxn = { _id: 'txn1', save: jest.fn() };
      Transaction.findById.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });
      const mockPayment = { method: 'stripe', stripePaymentIntentId: 'pi_test', status: 'held', save: jest.fn() };
      PaymentRecord.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockPayment) });

      const Stripe = require('stripe');
      Stripe.__mock.paymentIntents.cancel.mockRejectedValueOnce(new Error('Stripe cancel failed'));

      await adminController.refundPayment(req, res, next);
      expect(console.error).toHaveBeenCalledWith('Stripe cancel error:', 'Stripe cancel failed');
      expect(mockPayment.status).toBe('refunded');
      expect(res.status).toHaveBeenCalledWith(200);
      console.error.mockRestore();
    });

    it('should call next on error and abort transaction', async () => {
      req.params = { id: 'txn1' };
      req.body = { reason: 'test' };
      const mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
      Transaction.findById.mockReturnValue({
        session: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      await adminController.refundPayment(req, res, next);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users', async () => {
      req.query = { page: 1, limit: 20 };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(0);

      await adminController.getAllUsers(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should filter by role', async () => {
      req.query = { role: 'admin' };
      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      User.find.mockReturnValue(mockQuery);
      User.countDocuments.mockResolvedValue(0);

      await adminController.getAllUsers(req, res, next);
      expect(User.find).toHaveBeenCalledWith(expect.objectContaining({ role: 'admin' }));
    });

    it('should call next on error', async () => {
      req.query = {};
      User.find.mockImplementation(() => { throw new Error('DB error'); });
      await adminController.getAllUsers(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      User.countDocuments.mockResolvedValue(10);
      Transaction.countDocuments
        .mockResolvedValueOnce(50)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(30);
      Transaction.aggregate.mockResolvedValue([{ totalRevenue: 5000, totalVolume: 100000 }]);

      await adminController.getDashboardStats(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ totalUsers: 10 }),
      }));
    });

    it('should handle empty revenue result', async () => {
      User.countDocuments.mockResolvedValue(0);
      Transaction.countDocuments.mockResolvedValue(0);
      Transaction.aggregate.mockResolvedValue([]);

      await adminController.getDashboardStats(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ totalRevenue: 0, totalVolume: 0 }),
      }));
    });

    it('should call next on error', async () => {
      User.countDocuments.mockRejectedValue(new Error('DB error'));
      await adminController.getDashboardStats(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
