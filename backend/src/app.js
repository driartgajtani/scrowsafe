require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');

const env = require('./config/env');
if (!env.isResolved) env.resolve();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const documentRoutes = require('./routes/documentRoutes');
const tidioRoutes = require('./routes/tidioRoutes');
const walletRoutes = require('./routes/walletRoutes');
const paymentController = require('./controllers/paymentController');

const app = express();

// Stripe webhook needs raw body — must come before express.json()
app.post(
  '/api/payments/stripe-webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: env.get('CLIENT_URL'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize mongo queries
app.use(mongoSanitize());

// Logging
if (env.get('NODE_ENV') === 'development') {
  app.use(morgan('dev'));
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/tidio', tidioRoutes);
app.use('/api/wallets', walletRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Scrowsafe API is running', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(env.get('PORT'), () => {
    console.log(`Scrowsafe API running on port ${env.get('PORT')} in ${env.get('NODE_ENV')} mode`);
  });
};

if (env.get('NODE_ENV') !== 'test') {
  startServer();
}

module.exports = app;
