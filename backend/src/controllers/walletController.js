const Wallet = require('../models/Wallet');
const ApiResponse = require('../utils/apiResponse');

exports.getPublicWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.find({ enabled: true }).sort({ label: 1 }).lean();
    ApiResponse.success(res, { wallets });
  } catch (error) {
    next(error);
  }
};

exports.getAllWallets = async (req, res, next) => {
  try {
    const wallets = await Wallet.find().sort({ label: 1 }).lean();
    ApiResponse.success(res, { wallets });
  } catch (error) {
    next(error);
  }
};

exports.upsertWallet = async (req, res, next) => {
  try {
    const { network } = req.params;
    const { label, address, explorer, enabled } = req.body;

    const wallet = await Wallet.findOneAndUpdate(
      { network: network.toLowerCase() },
      { label, address, explorer, enabled: enabled !== false },
      { upsert: true, new: true, runValidators: true }
    );

    ApiResponse.success(res, { wallet }, 'Wallet updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteWallet = async (req, res, next) => {
  try {
    const { network } = req.params;
    const wallet = await Wallet.findOneAndDelete({ network: network.toLowerCase() });

    if (!wallet) {
      return ApiResponse.notFound(res, 'Wallet not found.');
    }

    ApiResponse.success(res, null, 'Wallet deleted successfully');
  } catch (error) {
    next(error);
  }
};
