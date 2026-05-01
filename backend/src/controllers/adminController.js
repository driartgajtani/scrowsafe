const mongoose = require('mongoose');
const Stripe = require('stripe');
const Transaction = require('../models/Transaction');
const PaymentRecord = require('../models/PaymentRecord');
const User = require('../models/User');
const Document = require('../models/Document');
const ApiResponse = require('../utils/apiResponse');
const { decrypt } = require('../utils/encryption');
const env = require('../config/env');

const stripe = new Stripe(env.get('STRIPE_SECRET_KEY'));

exports.getAllTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, platform, sort = '-createdAt' } = req.query;
    const filter = {};
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

exports.getTransactionDetail = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('buyerId', 'name email role')
      .populate('sellerId', 'name email role');

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    // Decrypt sensitive fields for admin view
    const decryptedData = {
      ...transaction.toObject(),
      sellerCredentials: transaction.sellerCredentials ? decrypt(transaction.sellerCredentials) : null,
      sellerRecoveryEmail: transaction.sellerRecoveryEmail ? decrypt(transaction.sellerRecoveryEmail) : null,
      sellerPayoutInfo: transaction.sellerPayoutInfo ? decrypt(transaction.sellerPayoutInfo) : null,
    };

    const [payments, documents] = await Promise.all([
      PaymentRecord.find({ transactionId: transaction._id }).lean(),
      Document.find({ transactionId: transaction._id }).lean(),
    ]);

    ApiResponse.success(res, {
      transaction: decryptedData,
      payments,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateTransactionStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status, adminNotes, refundReason } = req.body;

    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    const statusProgressMap = {
      pending: 1,
      payment_received: 2,
      credentials_received: 3,
      takeover_in_progress: 3,
      completed: 4,
      refunded: transaction.progressStep,
      disputed: transaction.progressStep,
    };

    transaction.status = status;
    transaction.progressStep = statusProgressMap[status] || transaction.progressStep;

    if (adminNotes) {
      transaction.adminNotes = `${transaction.adminNotes}\n[${new Date().toISOString()}] ${adminNotes}`.trim();
    }

    if (status === 'completed') {
      transaction.completedAt = new Date();
      transaction.buyerCredentialsReceived = true;
    }

    if (status === 'refunded') {
      transaction.refundedAt = new Date();
      transaction.refundReason = refundReason || '';
    }

    await transaction.save({ session });
    await session.commitTransaction();

    const populated = await Transaction.findById(transaction._id)
      .populate('buyerId', 'name email')
      .populate('sellerId', 'name email');

    ApiResponse.success(res, { transaction: populated }, `Transaction status updated to ${status}`);
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.releaseFunds = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    if (transaction.status !== 'completed') {
      await session.abortTransaction();
      return ApiResponse.badRequest(res, 'Transaction must be completed before releasing funds.');
    }

    const paymentRecord = await PaymentRecord.findOne({
      transactionId: transaction._id,
      status: 'held',
    }).session(session);

    if (!paymentRecord) {
      await session.abortTransaction();
      return ApiResponse.badRequest(res, 'No held payment found for this transaction.');
    }

    // Capture the held payment in Stripe
    if (paymentRecord.method === 'stripe' && paymentRecord.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.capture(paymentRecord.stripePaymentIntentId);
      } catch (stripeErr) {
        console.error('Stripe capture error:', stripeErr.message);
      }
    }

    paymentRecord.status = 'released';
    await paymentRecord.save({ session });

    await session.commitTransaction();
    ApiResponse.success(res, { paymentRecord }, 'Funds released to seller.');
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.refundPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { reason } = req.body;

    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    const paymentRecord = await PaymentRecord.findOne({
      transactionId: transaction._id,
      status: 'held',
    }).session(session);

    if (!paymentRecord) {
      await session.abortTransaction();
      return ApiResponse.badRequest(res, 'No held payment found to refund.');
    }

    if (paymentRecord.method === 'stripe' && paymentRecord.stripePaymentIntentId) {
      try {
        await stripe.paymentIntents.cancel(paymentRecord.stripePaymentIntentId);
      } catch (stripeErr) {
        console.error('Stripe cancel error:', stripeErr.message);
      }
    }

    paymentRecord.status = 'refunded';
    await paymentRecord.save({ session });

    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundReason = reason || 'Admin initiated refund';
    await transaction.save({ session });

    await session.commitTransaction();
    ApiResponse.success(res, { transaction, paymentRecord }, 'Payment refunded.');
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter),
    ]);

    ApiResponse.success(res, {
      users,
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

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      revenueResult,
    ] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: { $nin: ['completed', 'refunded'] } }),
      Transaction.countDocuments({ status: 'completed' }),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$escrowFee' }, totalVolume: { $sum: '$amount' } } },
      ]),
    ]);

    const revenue = revenueResult[0] || { totalRevenue: 0, totalVolume: 0 };

    ApiResponse.success(res, {
      totalUsers,
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      totalRevenue: revenue.totalRevenue,
      totalVolume: revenue.totalVolume,
    });
  } catch (error) {
    next(error);
  }
};
