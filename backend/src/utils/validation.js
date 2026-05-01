const Joi = require('joi');
const { PLATFORMS, PAYMENT_METHODS, DOCUMENT_TYPES } = require('../config/constants');

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
  }),
  role: Joi.string().valid('buyer', 'seller').default('buyer'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const createTransactionSchema = Joi.object({
  counterpartyEmail: Joi.string().email().lowercase().trim().required(),
  platform: Joi.string()
    .valid(...PLATFORMS)
    .required(),
  accountUsername: Joi.string().trim().max(200).optional(),
  accountDescription: Joi.string().trim().max(1000).optional(),
  amount: Joi.number().min(1).max(1000000).required(),
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .optional(),
  role: Joi.string().valid('buyer', 'seller').required().messages({
    'any.required': 'Specify whether you are the buyer or seller in this deal',
  }),
});

const updateTransactionStatusSchema = Joi.object({
  status: Joi.string()
    .valid(
      'pending',
      'payment_received',
      'credentials_received',
      'takeover_in_progress',
      'completed',
      'refunded',
      'disputed'
    )
    .required(),
  adminNotes: Joi.string().max(2000).optional(),
  refundReason: Joi.string().max(500).optional(),
});

const submitCredentialsSchema = Joi.object({
  credentials: Joi.string().min(1).max(5000).required(),
  recoveryEmail: Joi.string().email().optional(),
  payoutInfo: Joi.string().min(1).max(2000).required(),
});

const feeCalculateSchema = Joi.object({
  platform: Joi.string()
    .valid(...PLATFORMS)
    .required(),
  amount: Joi.number().min(1).max(1000000).required(),
});

const documentUploadSchema = Joi.object({
  type: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .required(),
});

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().optional(),
  platform: Joi.string().optional(),
  sort: Joi.string().valid('createdAt', '-createdAt', 'amount', '-amount').default('-createdAt'),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
}).min(1);

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required().messages({
    'string.min': 'New password must be at least 8 characters long',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(128).required().messages({
    'string.min': 'Password must be at least 8 characters long',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  createTransactionSchema,
  updateTransactionStatusSchema,
  submitCredentialsSchema,
  feeCalculateSchema,
  documentUploadSchema,
  paginationSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
