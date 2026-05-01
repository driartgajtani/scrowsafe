require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Wallet = require('../models/Wallet');

const defaultWallets = [
  { network: 'ethereum', label: 'Ethereum (ETH / ERC-20)', address: '0xYOUR_ETH_WALLET_ADDRESS', explorer: 'https://etherscan.io/tx/' },
  { network: 'bitcoin', label: 'Bitcoin (BTC)', address: 'bc1YOUR_BTC_WALLET_ADDRESS', explorer: 'https://mempool.space/tx/' },
  { network: 'bsc', label: 'BNB Smart Chain (BEP-20)', address: '0xYOUR_BSC_WALLET_ADDRESS', explorer: 'https://bscscan.com/tx/' },
  { network: 'polygon', label: 'Polygon (MATIC)', address: '0xYOUR_POLYGON_WALLET_ADDRESS', explorer: 'https://polygonscan.com/tx/' },
  { network: 'solana', label: 'Solana (SOL)', address: 'YOUR_SOL_WALLET_ADDRESS', explorer: 'https://solscan.io/tx/' },
  { network: 'tron', label: 'Tron (TRC-20)', address: 'YOUR_TRON_WALLET_ADDRESS', explorer: 'https://tronscan.org/#/transaction/' },
  { network: 'arbitrum', label: 'Arbitrum', address: '0xYOUR_ARB_WALLET_ADDRESS', explorer: 'https://arbiscan.io/tx/' },
  { network: 'avalanche', label: 'Avalanche (AVAX)', address: '0xYOUR_AVAX_WALLET_ADDRESS', explorer: 'https://snowtrace.io/tx/' },
  { network: 'base', label: 'Base', address: '0xYOUR_BASE_WALLET_ADDRESS', explorer: 'https://basescan.org/tx/' },
  { network: 'optimism', label: 'Optimism', address: '0xYOUR_OP_WALLET_ADDRESS', explorer: 'https://optimistic.etherscan.io/tx/' },
];

const seedWallets = async () => {
  await connectDB();

  for (const w of defaultWallets) {
    const exists = await Wallet.findOne({ network: w.network });
    if (!exists) {
      await Wallet.create(w);
      console.log(`Created wallet: ${w.label}`);
    } else {
      console.log(`Wallet already exists: ${w.label}`);
    }
  }

  console.log('Wallet seeding complete.');
  process.exit(0);
};

seedWallets();
