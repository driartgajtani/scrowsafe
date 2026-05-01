class Env {
  #resolved = false;
  #vars = {};

  resolve() {
    if (this.#resolved) {
      throw new Error('Environment already resolved. Cannot re-resolve after initialization.');
    }

    this.#vars = Object.freeze({
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: parseInt(process.env.PORT, 10) || 5000,

      // Database
      MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/scrowsafe',

      // JWT
      JWT_SECRET: process.env.JWT_SECRET,
      JWT_EXPIRE: process.env.JWT_EXPIRE || '15m',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
      JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE || '7d',

      // Encryption
      ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'default-dev-key-change-me-in-prod',

      // Stripe
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
      STRIPE_ENABLED: process.env.STRIPE_ENABLED === 'true',

      // Email
      SMTP_HOST: process.env.SMTP_HOST || '',
      SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
      SMTP_USER: process.env.SMTP_USER || '',
      SMTP_PASS: process.env.SMTP_PASS || '',
      FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@scrowsafe.com',

      // Client
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:4200',

      // Uploads
      UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
      MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,

      // Features
      REQUIRE_EMAIL_VERIFICATION: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
    });

    this.#resolved = true;
    return this;
  }

  get(key) {
    if (!this.#resolved) {
      throw new Error('Environment not resolved. Call env.resolve() during app startup.');
    }
    if (!(key in this.#vars)) {
      throw new Error(`Unknown environment variable: ${key}`);
    }
    return this.#vars[key];
  }

  getAll() {
    if (!this.#resolved) {
      throw new Error('Environment not resolved. Call env.resolve() during app startup.');
    }
    return this.#vars;
  }

  get isResolved() {
    return this.#resolved;
  }
}

const env = new Env();

module.exports = env;
