const Document = require('../models/Document');
const Transaction = require('../models/Transaction');
const ApiResponse = require('../utils/apiResponse');

exports.uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return ApiResponse.badRequest(res, 'No file uploaded.');
    }

    const { type } = req.body;
    const transactionId = req.params.transactionId;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }],
    });

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    const document = await Document.create({
      transactionId: transaction._id,
      userId: req.user._id,
      fileUrl: `/uploads/${req.file.filename}`,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      type: type || 'proof',
    });

    ApiResponse.created(res, { document }, 'Document uploaded successfully.');
  } catch (error) {
    next(error);
  }
};

exports.getDocuments = async (req, res, next) => {
  try {
    const transactionId = req.params.transactionId;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }],
    });

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    const documents = await Document.find({ transactionId: transaction._id })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    ApiResponse.success(res, { documents });
  } catch (error) {
    next(error);
  }
};
