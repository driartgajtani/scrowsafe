const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect, requireVerified } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const {
  createTransactionSchema,
  submitCredentialsSchema,
  feeCalculateSchema,
  paginationSchema,
} = require('../utils/validation');

// Fee calculator (public — no auth needed)
router.post('/fee-calculate', validate(feeCalculateSchema), transactionController.feeCalculate);

// Protected routes
router.use(protect);

router.post('/', validate(createTransactionSchema), transactionController.createTransaction);
router.get('/', validateQuery(paginationSchema), transactionController.getMyTransactions);
router.get('/:id', transactionController.getTransactionById);
router.post('/:id/credentials', validate(submitCredentialsSchema), transactionController.submitCredentials);

module.exports = router;
