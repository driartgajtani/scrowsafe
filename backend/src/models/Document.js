const mongoose = require('mongoose');
const { DOCUMENT_TYPES } = require('../config/constants');

const documentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ transactionId: 1 });
documentSchema.index({ userId: 1 });

module.exports = mongoose.model('Document', documentSchema);
