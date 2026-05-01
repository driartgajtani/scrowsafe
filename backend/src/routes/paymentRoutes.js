const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-intent/:transactionId', protect, paymentController.createPaymentIntent);
router.post('/confirm', protect, paymentController.confirmPayment);
router.post('/wire', protect, paymentController.recordWirePayment);
router.post('/crypto', protect, paymentController.recordCryptoPayment);

module.exports = router;
