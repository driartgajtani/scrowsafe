const mongoose = require('mongoose');
const Stripe = require('stripe');
const Transaction = require('../models/Transaction');
const PaymentRecord = require('../models/PaymentRecord');
const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

const stripe = new Stripe(env.get('STRIPE_SECRET_KEY'));

exports.createPaymentIntent = async (req, res, next) => {
  try {
    if (!env.get('STRIPE_ENABLED')) {
      return ApiResponse.badRequest(res, 'Card payments are temporarily disabled. Please use crypto or wire transfer.');
    }

    const transaction = await Transaction.findOne({
      _id: req.params.transactionId,
      buyerId: req.user._id,
      status: 'pending',
    });

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found or not in pending status.');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(transaction.totalToPay * 100),
      currency: 'usd',
      metadata: {
        transactionId: transaction._id.toString(),
        txnId: transaction.transactionId,
        platform: transaction.platform,
      },
      capture_method: 'manual', // Hold funds, release later
    });

    await PaymentRecord.create({
      transactionId: transaction._id,
      amount: transaction.totalToPay,
      method: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      status: 'pending',
    });

    ApiResponse.success(res, {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: transaction.totalToPay,
    });
  } catch (error) {
    next(error);
  }
};

exports.confirmPayment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { paymentIntentId } = req.body;

    const paymentRecord = await PaymentRecord.findOne({ stripePaymentIntentId: paymentIntentId }).session(session);
    if (!paymentRecord) {
      await session.abortTransaction();
      return ApiResponse.notFound(res, 'Payment record not found.');
    }

    const transaction = await Transaction.findById(paymentRecord.transactionId).session(session);
    if (!transaction) {
      await session.abortTransaction();
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'requires_capture' || paymentIntent.status === 'succeeded') {
      paymentRecord.status = 'held';
      paymentRecord.providerTxId = paymentIntent.id;
      await paymentRecord.save({ session });

      transaction.status = 'payment_received';
      transaction.progressStep = 2;
      await transaction.save({ session });

      await session.commitTransaction();
      ApiResponse.success(res, { transaction, paymentRecord }, 'Payment confirmed and held in escrow.');
    } else {
      paymentRecord.status = 'failed';
      await paymentRecord.save({ session });
      await session.commitTransaction();
      ApiResponse.badRequest(res, `Payment not completed. Status: ${paymentIntent.status}`);
    }
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Placeholder for wire transfer payment
exports.recordWirePayment = async (req, res, next) => {
  try {
    const { transactionId, referenceNumber } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      buyerId: req.user._id,
      status: 'pending',
    });

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    await PaymentRecord.create({
      transactionId: transaction._id,
      amount: transaction.totalToPay,
      method: 'wire',
      providerTxId: referenceNumber,
      status: 'pending',
      metadata: { note: 'Wire transfer — awaiting admin verification' },
    });

    ApiResponse.success(res, null, 'Wire payment recorded. Awaiting admin verification.');
  } catch (error) {
    next(error);
  }
};

// Placeholder for crypto payment
exports.recordCryptoPayment = async (req, res, next) => {
  try {
    const { transactionId, txHash, network } = req.body;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      buyerId: req.user._id,
      status: 'pending',
    });

    if (!transaction) {
      return ApiResponse.notFound(res, 'Transaction not found.');
    }

    await PaymentRecord.create({
      transactionId: transaction._id,
      amount: transaction.totalToPay,
      method: 'crypto',
      providerTxId: txHash,
      status: 'pending',
      metadata: { network, note: 'Crypto payment — awaiting admin verification' },
    });

    ApiResponse.success(res, null, 'Crypto payment recorded. Awaiting admin verification.');
  } catch (error) {
    next(error);
  }
};

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.get('STRIPE_WEBHOOK_SECRET'));
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object;
      console.log(`PaymentIntent ${pi.id} succeeded`);
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object;
      console.log(`PaymentIntent ${pi.id} failed`);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
};
