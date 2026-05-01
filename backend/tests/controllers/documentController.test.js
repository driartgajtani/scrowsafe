const mongoose = require('mongoose');
const documentController = require('../../src/controllers/documentController');
const Document = require('../../src/models/Document');
const Transaction = require('../../src/models/Transaction');

jest.mock('../../src/models/Document');
jest.mock('../../src/models/Transaction');

describe('Document Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      user: { _id: new mongoose.Types.ObjectId() },
      file: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('uploadDocument', () => {
    it('should return 400 if no file uploaded', async () => {
      req.file = null;
      await documentController.uploadDocument(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 if transaction not found', async () => {
      req.file = { filename: 'test.pdf', originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024 };
      req.params = { transactionId: 'txn1' };
      req.body = { type: 'proof' };
      Transaction.findOne.mockResolvedValue(null);
      await documentController.uploadDocument(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should upload document successfully', async () => {
      req.file = { filename: 'test.pdf', originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024 };
      req.params = { transactionId: 'txn1' };
      req.body = { type: 'proof' };
      Transaction.findOne.mockResolvedValue({ _id: 'txn1' });
      Document.create.mockResolvedValue({ _id: 'doc1', fileUrl: '/uploads/test.pdf' });

      await documentController.uploadDocument(req, res, next);
      expect(Document.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should default type to proof when not provided', async () => {
      req.file = { filename: 'test.pdf', originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024 };
      req.params = { transactionId: 'txn1' };
      req.body = {};
      Transaction.findOne.mockResolvedValue({ _id: 'txn1' });
      Document.create.mockResolvedValue({ _id: 'doc1' });

      await documentController.uploadDocument(req, res, next);
      expect(Document.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'proof' }));
    });

    it('should call next on error', async () => {
      req.file = { filename: 'test.pdf', originalname: 'doc.pdf', mimetype: 'application/pdf', size: 1024 };
      req.params = { transactionId: 'txn1' };
      req.body = {};
      Transaction.findOne.mockRejectedValue(new Error('DB error'));
      await documentController.uploadDocument(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getDocuments', () => {
    it('should return 404 if transaction not found', async () => {
      req.params = { transactionId: 'txn1' };
      Transaction.findOne.mockResolvedValue(null);
      await documentController.getDocuments(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return documents', async () => {
      req.params = { transactionId: 'txn1' };
      Transaction.findOne.mockResolvedValue({ _id: 'txn1' });
      Document.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([{ _id: 'doc1' }]),
        }),
      });

      await documentController.getDocuments(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.params = { transactionId: 'txn1' };
      Transaction.findOne.mockRejectedValue(new Error('DB error'));
      await documentController.getDocuments(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
