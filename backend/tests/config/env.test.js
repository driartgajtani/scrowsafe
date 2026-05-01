describe('Env', () => {
  let env;

  beforeEach(() => {
    jest.resetModules();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.MONGO_URI = 'mongodb://localhost/test';
    process.env.STRIPE_ENABLED = 'true';
    process.env.REQUIRE_EMAIL_VERIFICATION = 'true';
    process.env.NODE_ENV = 'test';
    env = require('../../src/config/env');
  });

  describe('resolve()', () => {
    it('should resolve environment variables', () => {
      env.resolve();
      expect(env.isResolved).toBe(true);
    });

    it('should freeze the resolved values', () => {
      env.resolve();
      const all = env.getAll();
      expect(Object.isFrozen(all)).toBe(true);
    });

    it('should throw if resolve() is called twice', () => {
      env.resolve();
      expect(() => env.resolve()).toThrow('Environment already resolved');
    });

    it('should parse PORT as integer', () => {
      jest.resetModules();
      process.env.PORT = '3000';
      const freshEnv = require('../../src/config/env');
      freshEnv.resolve();
      expect(freshEnv.get('PORT')).toBe(3000);
    });

    it('should default PORT to 5000', () => {
      jest.resetModules();
      delete process.env.PORT;
      const freshEnv = require('../../src/config/env');
      freshEnv.resolve();
      expect(freshEnv.get('PORT')).toBe(5000);
    });

    it('should parse STRIPE_ENABLED as boolean', () => {
      env.resolve();
      expect(env.get('STRIPE_ENABLED')).toBe(true);
    });

    it('should parse REQUIRE_EMAIL_VERIFICATION as boolean', () => {
      env.resolve();
      expect(env.get('REQUIRE_EMAIL_VERIFICATION')).toBe(true);
    });

    it('should set STRIPE_ENABLED to false when not "true"', () => {
      jest.resetModules();
      process.env.STRIPE_ENABLED = 'false';
      const freshEnv = require('../../src/config/env');
      freshEnv.resolve();
      expect(freshEnv.get('STRIPE_ENABLED')).toBe(false);
    });

    it('should use default values when env vars missing', () => {
      jest.resetModules();
      delete process.env.CLIENT_URL;
      delete process.env.UPLOAD_DIR;
      delete process.env.SMTP_PORT;
      const freshEnv = require('../../src/config/env');
      freshEnv.resolve();
      expect(freshEnv.get('CLIENT_URL')).toBe('http://localhost:4200');
      expect(freshEnv.get('UPLOAD_DIR')).toBe('uploads');
      expect(freshEnv.get('SMTP_PORT')).toBe(587);
    });

    it('should use all defaults when no env vars set', () => {
      jest.resetModules();
      const saved = { ...process.env };
      delete process.env.NODE_ENV;
      delete process.env.PORT;
      delete process.env.MONGO_URI;
      delete process.env.JWT_EXPIRE;
      delete process.env.JWT_REFRESH_EXPIRE;
      delete process.env.ENCRYPTION_KEY;
      delete process.env.STRIPE_SECRET_KEY;
      delete process.env.STRIPE_WEBHOOK_SECRET;
      delete process.env.STRIPE_ENABLED;
      delete process.env.SMTP_HOST;
      delete process.env.SMTP_PORT;
      delete process.env.SMTP_USER;
      delete process.env.SMTP_PASS;
      delete process.env.FROM_EMAIL;
      delete process.env.CLIENT_URL;
      delete process.env.UPLOAD_DIR;
      delete process.env.MAX_FILE_SIZE;
      delete process.env.REQUIRE_EMAIL_VERIFICATION;

      const freshEnv = require('../../src/config/env');
      freshEnv.resolve();

      expect(freshEnv.get('NODE_ENV')).toBe('development');
      expect(freshEnv.get('PORT')).toBe(5000);
      expect(freshEnv.get('MONGO_URI')).toBe('mongodb://localhost:27017/scrowsafe');
      expect(freshEnv.get('JWT_EXPIRE')).toBe('15m');
      expect(freshEnv.get('JWT_REFRESH_EXPIRE')).toBe('7d');
      expect(freshEnv.get('ENCRYPTION_KEY')).toBe('default-dev-key-change-me-in-prod');
      expect(freshEnv.get('STRIPE_SECRET_KEY')).toBe('sk_test_placeholder');
      expect(freshEnv.get('STRIPE_WEBHOOK_SECRET')).toBe('');
      expect(freshEnv.get('STRIPE_ENABLED')).toBe(false);
      expect(freshEnv.get('SMTP_HOST')).toBe('');
      expect(freshEnv.get('SMTP_PORT')).toBe(587);
      expect(freshEnv.get('SMTP_USER')).toBe('');
      expect(freshEnv.get('SMTP_PASS')).toBe('');
      expect(freshEnv.get('FROM_EMAIL')).toBe('noreply@scrowsafe.com');
      expect(freshEnv.get('CLIENT_URL')).toBe('http://localhost:4200');
      expect(freshEnv.get('UPLOAD_DIR')).toBe('uploads');
      expect(freshEnv.get('MAX_FILE_SIZE')).toBe(10 * 1024 * 1024);
      expect(freshEnv.get('REQUIRE_EMAIL_VERIFICATION')).toBe(false);

      Object.assign(process.env, saved);
    });
  });

  describe('get()', () => {
    it('should return a resolved variable', () => {
      env.resolve();
      expect(env.get('JWT_SECRET')).toBe('test-secret');
    });

    it('should throw if not resolved', () => {
      expect(() => env.get('PORT')).toThrow('Environment not resolved');
    });

    it('should throw for unknown keys', () => {
      env.resolve();
      expect(() => env.get('NONEXISTENT_VAR')).toThrow('Unknown environment variable');
    });
  });

  describe('getAll()', () => {
    it('should return all resolved variables', () => {
      env.resolve();
      const all = env.getAll();
      expect(all.JWT_SECRET).toBe('test-secret');
      expect(all.MONGO_URI).toBe('mongodb://localhost/test');
    });

    it('should throw if not resolved', () => {
      expect(() => env.getAll()).toThrow('Environment not resolved');
    });
  });

  describe('immutability', () => {
    it('should not change values after resolve even if process.env changes', () => {
      env.resolve();
      const originalSecret = env.get('JWT_SECRET');
      process.env.JWT_SECRET = 'changed-secret';
      expect(env.get('JWT_SECRET')).toBe(originalSecret);
    });
  });
});
