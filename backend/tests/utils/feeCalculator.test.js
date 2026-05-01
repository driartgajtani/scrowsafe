const { calculateFee } = require('../../src/utils/feeCalculator');

describe('calculateFee', () => {
  it('should calculate fee for instagram with amount above minimum', () => {
    const result = calculateFee('instagram', 1000);
    expect(result.platform).toBe('instagram');
    expect(result.amount).toBe(1000);
    expect(result.feeRate).toBe(0.05);
    expect(result.escrowFee).toBe(50);
    expect(result.totalToPay).toBe(1050);
    expect(result.minFee).toBe(25);
  });

  it('should apply minimum fee when calculated fee is too low', () => {
    const result = calculateFee('instagram', 100);
    expect(result.escrowFee).toBe(25);
    expect(result.totalToPay).toBe(125);
  });

  it('should handle case-insensitive platform names', () => {
    const result = calculateFee('INSTAGRAM', 1000);
    expect(result.platform).toBe('instagram');
    expect(result.escrowFee).toBe(50);
  });

  it('should throw for unsupported platform', () => {
    expect(() => calculateFee('myspace', 100)).toThrow('Unsupported platform: myspace');
  });

  it('should calculate fee for youtube (higher rate)', () => {
    const result = calculateFee('youtube', 2000);
    expect(result.feeRate).toBe(0.06);
    expect(result.escrowFee).toBe(120);
    expect(result.totalToPay).toBe(2120);
  });

  it('should calculate fee for spotify (lower rate)', () => {
    const result = calculateFee('spotify', 1000);
    expect(result.feeRate).toBe(0.04);
    expect(result.escrowFee).toBe(40);
  });

  it('should calculate fee for gaming (highest rate)', () => {
    const result = calculateFee('gaming', 1000);
    expect(result.feeRate).toBe(0.07);
    expect(result.escrowFee).toBe(70);
  });

  it('should apply minimum fee for snapchat', () => {
    const result = calculateFee('snapchat', 100);
    expect(result.escrowFee).toBe(20);
    expect(result.minFee).toBe(20);
  });

  it('should return properly rounded values', () => {
    const result = calculateFee('instagram', 333);
    expect(result.amount).toBe(333);
    expect(result.escrowFee).toBe(25);
  });

  it('should calculate all platforms without error', () => {
    const platforms = ['instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'snapchat', 'spotify', 'gaming'];
    platforms.forEach(platform => {
      expect(() => calculateFee(platform, 500)).not.toThrow();
    });
  });
});
