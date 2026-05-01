const mongoose = require('mongoose');
const dbHandler = require('../helpers/dbHandler');
const PaymentRecord = require('../../src/models/PaymentRecord');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('PaymentRecord Model', () => {
  const transactionId = new mongoose.Types.ObjectId();

  const validRecord = {
    transactionId,
    amount: 525,
    method: 'stripe',
  };

  describe('creation', () => {
    it('should create with valid fields', async () => {
      const record = await PaymentRecord.create(validRecord);
      expect(record._id).toBeDefined();
      expect(record.amount).toBe(525);
      expect(record.method).toBe('stripe');
      expect(record.status).toBe('pending');
    });

    it('should require transactionId', async () => {
      await expect(PaymentRecord.create({ amount: 100, method: 'stripe' })).rejects.toThrow();
    });

    it('should require amount', async () => {
      await expect(PaymentRecord.create({ transactionId, method: 'stripe' })).rejects.toThrow();
    });

    it('should require method', async () => {
      await expect(PaymentRecord.create({ transactionId, amount: 100 })).rejects.toThrow();
    });

    it('should reject invalid method', async () => {
      await expect(PaymentRecord.create({ ...validRecord, method: 'cash' })).rejects.toThrow();
    });

    it('should reject invalid status', async () => {
      await expect(PaymentRecord.create({ ...validRecord, status: 'invalid' })).rejects.toThrow();
    });

    it('should accept all valid methods', async () => {
      const methods = ['stripe', 'wire', 'crypto'];
      for (const method of methods) {
        const record = await PaymentRecord.create({ ...validRecord, method });
        expect(record.method).toBe(method);
      }
    });

    it('should accept all valid statuses', async () => {
      const statuses = ['pending', 'held', 'released', 'refunded', 'failed'];
      for (const status of statuses) {
        const record = await PaymentRecord.create({ ...validRecord, status });
        expect(record.status).toBe(status);
      }
    });

    it('should default providerTxId to null', async () => {
      const record = await PaymentRecord.create(validRecord);
      expect(record.providerTxId).toBeNull();
    });

    it('should default metadata to empty object', async () => {
      const record = await PaymentRecord.create(validRecord);
      expect(record.metadata).toEqual({});
    });
  });
});
