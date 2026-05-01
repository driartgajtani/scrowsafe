const mongoose = require('mongoose');
const transactionController = require('../../src/controllers/transactionController');
const Transaction = require('../../src/models/Transaction');
const User = require('../../src/models/User');
const { calculateFee } = require('../../src/utils/feeCalculator');

jest.mock('../../src/models/Transaction');
jest.mock('../../src/models/User');
jest.mock('../../src/utils/feeCalculator');

describe('Transaction Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { _id: new mongoose.Types.ObjectId() },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createTransaction', () => {
    beforeEach(() => {
      req.body = {
        counterpartyEmail: 'seller@example.com',
        platform: 'instagram',
        amount: 500,
        role: 'buyer',
      };
    });

    it('should return 400 if counterparty not found', async () => {
      User.findOne.mockResolvedValue(null);
      await transactionController.createTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 if trying to transact with self', async () => {
      User.findOne.mockResolvedValue({ _id: req.user._id });
      await transactionController.createTransaction(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create transaction successfully', async () => {
      const counterpartyId = new mongoose.Types.ObjectId();
      User.findOne.mockResolvedValue({ _id: counterpartyId });
      calculateFee.mockReturnValue({ escrowFee: 25, totalToPay: 525 });

      const mockTxn = { _id: 'txn1' };
      Transaction.create.mockResolvedValue(mockTxn);
      Transaction.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue({ ...mockTxn, buyerId: {}, sellerId: {} }),
        }),
      });

      await transactionController.createTransaction(req, res, next);
      expect(Transaction.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should call next on error', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));
      await transactionController.createTransaction(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMyTransactions', () => {
    it('should return paginated transactions', async () => {
      req.query = { page: 1, limit: 20, sort: '-createdAt' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([{ _id: 'txn1' }]),
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(1);

      await transactionController.getMyTransactions(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ pagination: expect.any(Object) }),
      }));
    });

    it('should apply status filter', async () => {
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

      await transactionController.getMyTransactions(req, res, next);
      expect(Transaction.find).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    });

    it('should apply platform filter', async () => {
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

      await transactionController.getMyTransactions(req, res, next);
      expect(Transaction.find).toHaveBeenCalledWith(expect.objectContaining({ platform: 'instagram' }));
    });

    it('should handle ascending sort', async () => {
      req.query = { sort: 'amount' };
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      };
      Transaction.find.mockReturnValue(mockQuery);
      Transaction.countDocuments.mockResolvedValue(0);

      await transactionController.getMyTransactions(req, res, next);
      expect(mockQuery.sort).toHaveBeenCalledWith({ amount: 1 });
    });

    it('should call next on error', async () => {
      req.query = {};
      Transaction.find.mockImplementation(() => { throw new Error('fail'); });
      await transactionController.getMyTransactions(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getTransactionById', () => {
    it('should return 404 if not found', async () => {
      req.params = { id: 'txn1' };
      Transaction.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });
      await transactionController.getTransactionById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return transaction', async () => {
      req.params = { id: 'txn1' };
      const mockTxn = { _id: 'txn1', status: 'pending' };
      Transaction.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockTxn),
        }),
      });
      await transactionController.getTransactionById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.params = { id: 'txn1' };
      Transaction.findOne.mockImplementation(() => { throw new Error('fail'); });
      await transactionController.getTransactionById(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('submitCredentials', () => {
    let mockSession;

    beforeEach(() => {
      mockSession = {
        startTransaction: jest.fn(),
        abortTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        endSession: jest.fn(),
      };
      jest.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
    });

    it('should return 404 if transaction not found', async () => {
      req.params = { id: 'txn1' };
      req.body = { credentials: 'creds', payoutInfo: 'paypal' };
      Transaction.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(null) });

      await transactionController.submitCredentials(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should return 400 if status is not payment_received', async () => {
      req.params = { id: 'txn1' };
      req.body = { credentials: 'creds', payoutInfo: 'paypal' };
      Transaction.findOne.mockReturnValue({
        session: jest.fn().mockResolvedValue({ status: 'pending', sellerId: req.user._id }),
      });

      await transactionController.submitCredentials(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should submit credentials successfully', async () => {
      req.params = { id: 'txn1' };
      req.body = { credentials: 'user:pass', recoveryEmail: 'recovery@email.com', payoutInfo: 'paypal_email' };
      const mockTxn = {
        status: 'payment_received',
        sellerId: req.user._id,
        save: jest.fn().mockResolvedValue(undefined),
      };
      Transaction.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });

      await transactionController.submitCredentials(req, res, next);
      expect(mockTxn.sellerCredentials).toBe('user:pass');
      expect(mockTxn.sellerRecoveryEmail).toBe('recovery@email.com');
      expect(mockTxn.sellerPayoutInfo).toBe('paypal_email');
      expect(mockTxn.status).toBe('credentials_received');
      expect(mockTxn.progressStep).toBe(3);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should submit credentials without recoveryEmail', async () => {
      req.params = { id: 'txn1' };
      req.body = { credentials: 'user:pass', payoutInfo: 'paypal_email' };
      const mockTxn = {
        status: 'payment_received',
        sellerId: req.user._id,
        save: jest.fn().mockResolvedValue(undefined),
      };
      Transaction.findOne.mockReturnValue({ session: jest.fn().mockResolvedValue(mockTxn) });

      await transactionController.submitCredentials(req, res, next);
      expect(mockTxn.sellerRecoveryEmail).toBe('');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error and abort transaction', async () => {
      req.params = { id: 'txn1' };
      req.body = { credentials: 'creds', payoutInfo: 'paypal' };
      Transaction.findOne.mockReturnValue({ session: jest.fn().mockRejectedValue(new Error('DB error')) });

      await transactionController.submitCredentials(req, res, next);
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });

  describe('feeCalculate', () => {
    it('should return fee calculation', async () => {
      req.body = { platform: 'instagram', amount: 500 };
      calculateFee.mockReturnValue({ escrowFee: 25, totalToPay: 525 });
      await transactionController.feeCalculate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.body = { platform: 'invalid', amount: 500 };
      calculateFee.mockImplementation(() => { throw new Error('Unsupported'); });
      await transactionController.feeCalculate(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
