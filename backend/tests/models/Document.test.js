const mongoose = require('mongoose');
const dbHandler = require('../helpers/dbHandler');
const Document = require('../../src/models/Document');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Document Model', () => {
  const transactionId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  const validDoc = {
    transactionId,
    userId,
    fileUrl: '/uploads/test-file.pdf',
    originalName: 'document.pdf',
    mimeType: 'application/pdf',
    fileSize: 1024,
    type: 'proof',
  };

  describe('creation', () => {
    it('should create with valid fields', async () => {
      const doc = await Document.create(validDoc);
      expect(doc._id).toBeDefined();
      expect(doc.fileUrl).toBe('/uploads/test-file.pdf');
      expect(doc.type).toBe('proof');
    });

    it('should require transactionId', async () => {
      await expect(Document.create({ ...validDoc, transactionId: undefined })).rejects.toThrow();
    });

    it('should require userId', async () => {
      await expect(Document.create({ ...validDoc, userId: undefined })).rejects.toThrow();
    });

    it('should require fileUrl', async () => {
      await expect(Document.create({ ...validDoc, fileUrl: undefined })).rejects.toThrow();
    });

    it('should require originalName', async () => {
      await expect(Document.create({ ...validDoc, originalName: undefined })).rejects.toThrow();
    });

    it('should require type', async () => {
      await expect(Document.create({ ...validDoc, type: undefined })).rejects.toThrow();
    });

    it('should reject invalid type', async () => {
      await expect(Document.create({ ...validDoc, type: 'selfie' })).rejects.toThrow();
    });

    it('should accept all valid types', async () => {
      const types = ['id', 'proof', 'contract'];
      for (const type of types) {
        const doc = await Document.create({ ...validDoc, type });
        expect(doc.type).toBe(type);
      }
    });
  });
});
