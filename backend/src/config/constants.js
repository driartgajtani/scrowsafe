const PLATFORMS = [
  'instagram',
  'tiktok',
  'youtube',
  'facebook',
  'twitter',
  'snapchat',
  'spotify',
  'gaming',
];

const TRANSACTION_STATUSES = [
  'pending',
  'payment_received',
  'credentials_received',
  'takeover_in_progress',
  'completed',
  'refunded',
  'disputed',
];

const PAYMENT_METHODS = ['stripe', 'wire', 'crypto'];
const PAYMENT_STATUSES = ['pending', 'held', 'released', 'refunded', 'failed'];
const USER_ROLES = ['buyer', 'seller', 'admin'];
const DOCUMENT_TYPES = ['id', 'proof', 'contract'];

// Platform-specific fee percentages (of transaction amount)
const PLATFORM_FEES = {
  instagram: 0.05,
  tiktok: 0.05,
  youtube: 0.06,
  facebook: 0.05,
  twitter: 0.05,
  snapchat: 0.05,
  spotify: 0.04,
  gaming: 0.07,
};

// Minimum fees per platform (in USD)
const MIN_FEES = {
  instagram: 25,
  tiktok: 25,
  youtube: 50,
  facebook: 25,
  twitter: 25,
  snapchat: 20,
  spotify: 15,
  gaming: 30,
};

module.exports = {
  PLATFORMS,
  TRANSACTION_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  USER_ROLES,
  DOCUMENT_TYPES,
  PLATFORM_FEES,
  MIN_FEES,
};
