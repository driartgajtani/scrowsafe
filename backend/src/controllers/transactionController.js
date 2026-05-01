const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { calculateFee } = require('../utils/feeCalculator');

exports.createTransaction = async (req, res, next) => {
  try {
    const { counterpartyEmail, platform, accountUsername, accountDescription, amount, paymentMethod, role } = req.body;

    const counterparty = await User.findOne({ email: counterpartyEmail });
    if (!counterparty) {
      return ApiResponse.badRequest(res, 'The counterparty email is not registered on the platform.');
    }

    if (counterparty._id.equals(req.user._id)) {
      return ApiResponse.badRequest(res, 'You cannot create a transaction with yourself.');
    }

    const feeData = calculateFee(platform, amount);

    const buyerId = role === 'buyer' ? req.user._id : counterparty._id;
    const sellerId = role === 'seller' ? req.user._id : counterparty._id;

    const transaction = await Transaction.create({
      transactionId: `TXN-${uuidv4().slice(0, 8).toUpperCase()}`,
      buyerId,
      sellerId,
      platform,
      accountUsername,
      accountDescription,
      amount,
      escrowFee: feeData.escrowFee,
      totalToPay: feeData.totalToPay,
      paymentMethod: paymentMethod || 'crypto',
      status: 'pending',
      progressStep: 1,
    });

    const populated = await Transaction.findById(transaction._id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    ApiResponse.created(res, { transaction: populated }, 'Transaction created successfully');
  } catch (error) {
    next(error);
  }
};

exports.getMyTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, platform, sort = '-createdAt' } = req.query;

    const filter = {
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }],
    };

    if (status) filter.status = status;
    if (platform) filter.platform = platform;

    const skip = (page - 1) * limit;
    const sortObj = {};
    if (sort.startsWith('-')) {
      sortObj[sort.slice(1)] = -1;
    } else {
      sortObj[sort] = 1;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('buyerId', 'name email')
        .populate('sellerId', 'name email')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    ApiResponse.success(res, {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      $or: [{ buyerId: req.user._id }, { sellerId: req.user._id }],
    })
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    ApiResponse.success(res, { transaction });
  } catch (error) {
    next(error);
  }
};

exports.submitCredentials = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { credentials, recoveryEmail, payoutInfo } = req.body;

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      sellerId: req.user._id,
    }).session(session);

    if (!transaction) {
      await session.abortTransaction();
      return ApiResponse.notFound(res, 'Transaction not found or you are not the seller.');
    }

    if (transaction.status !== 'payment_received') {
      await session.abortTransaction();
      return ApiResponse.badRequest(res, 'Payment must be received before submitting credentials.');
    }

    transaction.sellerCredentials = credentials;
    transaction.sellerRecoveryEmail = recoveryEmail || '';
    transaction.sellerPayoutInfo = payoutInfo;
    transaction.status = 'credentials_received';
    transaction.progressStep = 3;

    await transaction.save({ session });
    await session.commitTransaction();

    ApiResponse.success(res, { transaction }, 'Credentials submitted securely.');
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.feeCalculate = async (req, res, next) => {
  try {
    const { platform, amount } = req.body;
    const feeData = calculateFee(platform, amount);
    ApiResponse.success(res, feeData);
  } catch (error) {
    next(error);
  }
};
