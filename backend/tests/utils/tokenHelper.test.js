const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../src/utils/tokenHelper');

describe('tokenHelper', () => {
  const userId = '507f1f77bcf86cd799439011';

  describe('generateAccessToken', () => {
    it('should generate a valid JWT with user id', () => {
      const token = generateAccessToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded.id).toBe(userId);
    });

    it('should set expiration', () => {
      const token = generateAccessToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should use the configured expiration from env', () => {
      const token = generateAccessToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.exp - decoded.iat).toBe(900); // 15m = 900s
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh JWT with user id', () => {
      const token = generateRefreshToken(userId);
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
      expect(decoded.id).toBe(userId);
    });

    it('should use refresh secret (different from access)', () => {
      const token = generateRefreshToken(userId);
      expect(() => jwt.verify(token, process.env.JWT_SECRET)).toThrow();
    });

    it('should use the configured refresh expiration from env', () => {
      const token = generateRefreshToken(userId);
      const decoded = jwt.decode(token);
      expect(decoded.exp - decoded.iat).toBe(7 * 24 * 60 * 60); // 7d
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(userId);
      const decoded = verifyRefreshToken(token);
      expect(decoded.id).toBe(userId);
    });

    it('should throw for invalid token', () => {
      expect(() => verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw for token signed with wrong secret', () => {
      const token = jwt.sign({ id: userId }, 'wrong-secret');
      expect(() => verifyRefreshToken(token)).toThrow();
    });

    it('should throw for expired token', () => {
      const token = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '-1s' });
      expect(() => verifyRefreshToken(token)).toThrow();
    });
  });
});
