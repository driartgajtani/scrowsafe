const mongoose = require('mongoose');
const { PLATFORMS, TRANSACTION_STATUSES, PAYMENT_METHODS } = require('../config/constants');
const { encrypt, decrypt } = require('../utils/encryption');

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      unique: true,
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Buyer is required'],
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
    },
    platform: {
      type: String,
      enum: PLATFORMS,
      required: [true, 'Platform is required'],
    },
    accountUsername: {
      type: String,
      trim: true,
    },
    accountDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be at least $1'],
    },
    escrowFee: {
      type: Number,
      required: true,
    },
    totalToPay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: 'pending',
    },
    progressStep: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
    },
    // Encrypted sensitive fields
    sellerCredentials: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    sellerPayoutInfo: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    sellerRecoveryEmail: {
      type: String,
      set: encrypt,
      get: decrypt,
    },
    buyerCredentialsReceived: {
      type: Boolean,
      default: false,
    },
    adminNotes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: false },
    toObject: { getters: true },
  }
);

transactionSchema.index({ buyerId: 1 });
transactionSchema.index({ sellerId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
