const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const walletController = require('../controllers/walletController');
const { protect, authorize } = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { updateTransactionStatusSchema, paginationSchema } = require('../utils/validation');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getAllUsers);
router.get('/transactions', validateQuery(paginationSchema), adminController.getAllTransactions);
router.get('/transactions/:id', adminController.getTransactionDetail);
router.put('/transactions/:id/status', validate(updateTransactionStatusSchema), adminController.updateTransactionStatus);
router.post('/transactions/:id/release', adminController.releaseFunds);
router.post('/transactions/:id/refund', adminController.refundPayment);

router.get('/wallets', walletController.getAllWallets);
router.put('/wallets/:network', walletController.upsertWallet);
router.delete('/wallets/:network', walletController.deleteWallet);

module.exports = router;
