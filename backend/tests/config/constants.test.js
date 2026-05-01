const {
  PLATFORMS,
  TRANSACTION_STATUSES,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  USER_ROLES,
  DOCUMENT_TYPES,
  PLATFORM_FEES,
  MIN_FEES,
} = require('../../src/config/constants');

describe('Constants', () => {
  it('should export PLATFORMS array with expected values', () => {
    expect(PLATFORMS).toContain('instagram');
    expect(PLATFORMS).toContain('tiktok');
    expect(PLATFORMS).toContain('youtube');
    expect(PLATFORMS).toContain('facebook');
    expect(PLATFORMS).toContain('twitter');
    expect(PLATFORMS).toContain('snapchat');
    expect(PLATFORMS).toContain('spotify');
    expect(PLATFORMS).toContain('gaming');
    expect(PLATFORMS).toHaveLength(8);
  });

  it('should export TRANSACTION_STATUSES', () => {
    expect(TRANSACTION_STATUSES).toContain('pending');
    expect(TRANSACTION_STATUSES).toContain('payment_received');
    expect(TRANSACTION_STATUSES).toContain('completed');
    expect(TRANSACTION_STATUSES).toContain('refunded');
    expect(TRANSACTION_STATUSES).toContain('disputed');
    expect(TRANSACTION_STATUSES).toHaveLength(7);
  });

  it('should export PAYMENT_METHODS', () => {
    expect(PAYMENT_METHODS).toEqual(['stripe', 'wire', 'crypto']);
  });

  it('should export PAYMENT_STATUSES', () => {
    expect(PAYMENT_STATUSES).toEqual(['pending', 'held', 'released', 'refunded', 'failed']);
  });

  it('should export USER_ROLES', () => {
    expect(USER_ROLES).toEqual(['buyer', 'seller', 'admin']);
  });

  it('should export DOCUMENT_TYPES', () => {
    expect(DOCUMENT_TYPES).toEqual(['id', 'proof', 'contract']);
  });

  it('should have PLATFORM_FEES for all platforms', () => {
    PLATFORMS.forEach(platform => {
      expect(PLATFORM_FEES[platform]).toBeDefined();
      expect(typeof PLATFORM_FEES[platform]).toBe('number');
      expect(PLATFORM_FEES[platform]).toBeGreaterThan(0);
      expect(PLATFORM_FEES[platform]).toBeLessThan(1);
    });
  });

  it('should have MIN_FEES for all platforms', () => {
    PLATFORMS.forEach(platform => {
      expect(MIN_FEES[platform]).toBeDefined();
      expect(typeof MIN_FEES[platform]).toBe('number');
      expect(MIN_FEES[platform]).toBeGreaterThan(0);
    });
  });
});
