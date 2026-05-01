require('dotenv').config();

const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: 'admin@scrowsafe.com' });
  if (existing) {
    console.log('Admin user already exists.');
    process.exit(0);
  }

  await User.create({
    name: 'Scrowsafe Admin',
    email: 'admin@scrowsafe.com',
    password: 'Admin@123456',
    role: 'admin',
    verified: true,
  });

  console.log('Admin user created: admin@scrowsafe.com / Admin@123456');
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
