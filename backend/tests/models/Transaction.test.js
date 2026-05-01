const mongoose = require('mongoose');
const dbHandler = require('../helpers/dbHandler');
const Transaction = require('../../src/models/Transaction');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Transaction Model', () => {
  const buyerId = new mongoose.Types.ObjectId();
  const sellerId = new mongoose.Types.ObjectId();

  const validTransaction = {
    transactionId: 'TXN-ABC12345',
    buyerId,
    sellerId,
    platform: 'instagram',
    amount: 500,
    escrowFee: 25,
    totalToPay: 525,
  };

  describe('creation', () => {
    it('should create a transaction with valid fields', async () => {
      const txn = await Transaction.create(validTransaction);
      expect(txn._id).toBeDefined();
      expect(txn.transactionId).toBe('TXN-ABC12345');
      expect(txn.status).toBe('pending');
      expect(txn.progressStep).toBe(1);
    });

    it('should require transactionId', async () => {
      await expect(Transaction.create({ ...validTransaction, transactionId: undefined })).rejects.toThrow();
    });

    it('should require buyerId', async () => {
      await expect(Transaction.create({ ...validTransaction, buyerId: undefined })).rejects.toThrow();
    });

    it('should require sellerId', async () => {
      await expect(Transaction.create({ ...validTransaction, sellerId: undefined })).rejects.toThrow();
    });

    it('should require platform', async () => {
      await expect(Transaction.create({ ...validTransaction, platform: undefined })).rejects.toThrow();
    });

    it('should reject invalid platform', async () => {
      await expect(Transaction.create({ ...validTransaction, platform: 'myspace' })).rejects.toThrow();
    });

    it('should require amount', async () => {
      await expect(Transaction.create({ ...validTransaction, amount: undefined })).rejects.toThrow();
    });

    it('should enforce amount minimum of 1', async () => {
      await expect(Transaction.create({ ...validTransaction, amount: 0 })).rejects.toThrow();
    });

    it('should enforce unique transactionId', async () => {
      await Transaction.create(validTransaction);
      await expect(Transaction.create(validTransaction)).rejects.toThrow();
    });

    it('should accept valid status values', async () => {
      const txn = await Transaction.create({ ...validTransaction, transactionId: 'TXN-2', status: 'completed' });
      expect(txn.status).toBe('completed');
    });

    it('should reject invalid status', async () => {
      await expect(Transaction.create({
        ...validTransaction, transactionId: 'TXN-3', status: 'invalid',
      })).rejects.toThrow();
    });
  });

  describe('encrypted fields', () => {
    it('should encrypt and store sellerCredentials', async () => {
      const txn = await Transaction.create(validTransaction);
      txn.sellerCredentials = 'secret_login:password123';
      await txn.save();

      const raw = await mongoose.connection.collection('transactions').findOne({ _id: txn._id });
      expect(raw.sellerCredentials).not.toBe('secret_login:password123');
      expect(raw.sellerCredentials).toBeDefined();
    });

    it('should decrypt sellerCredentials on toObject with getters', async () => {
      const txn = await Transaction.create(validTransaction);
      txn.sellerCredentials = 'secret_login:password123';
      await txn.save();

      const loaded = await Transaction.findById(txn._id);
      const obj = loaded.toObject();
      expect(obj.sellerCredentials).toBe('secret_login:password123');
    });
  });

  describe('defaults', () => {
    it('should default status to pending', async () => {
      const txn = await Transaction.create(validTransaction);
      expect(txn.status).toBe('pending');
    });

    it('should default progressStep to 1', async () => {
      const txn = await Transaction.create(validTransaction);
      expect(txn.progressStep).toBe(1);
    });

    it('should default buyerCredentialsReceived to false', async () => {
      const txn = await Transaction.create(validTransaction);
      expect(txn.buyerCredentialsReceived).toBe(false);
    });
  });
});
