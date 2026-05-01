const { PLATFORM_FEES, MIN_FEES } = require('../config/constants');

function calculateFee(platform, amount) {
  const normalizedPlatform = platform.toLowerCase();
  const feeRate = PLATFORM_FEES[normalizedPlatform];

  if (!feeRate) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  const calculatedFee = amount * feeRate;
  const minFee = MIN_FEES[normalizedPlatform] || 0;
  const escrowFee = Math.max(calculatedFee, minFee);
  const totalToPay = amount + escrowFee;

  return {
    platform: normalizedPlatform,
    amount: parseFloat(amount.toFixed(2)),
    feeRate,
    escrowFee: parseFloat(escrowFee.toFixed(2)),
    totalToPay: parseFloat(totalToPay.toFixed(2)),
    minFee,
  };
}

module.exports = { calculateFee };
