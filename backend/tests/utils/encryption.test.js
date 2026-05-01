const { encrypt, decrypt } = require('../../src/utils/encryption');

describe('encryption', () => {
  describe('encrypt', () => {
    it('should encrypt a string', () => {
      const result = encrypt('hello world');
      expect(result).toBeDefined();
      expect(result).not.toBe('hello world');
    });

    it('should return falsy values as-is', () => {
      expect(encrypt(null)).toBeNull();
      expect(encrypt(undefined)).toBeUndefined();
      expect(encrypt('')).toBe('');
    });

    it('should produce different ciphertext each time (due to IV)', () => {
      const a = encrypt('test');
      const b = encrypt('test');
      expect(a).not.toBe(b);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string back to original', () => {
      const original = 'my secret credentials';
      const encrypted = encrypt(original);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(original);
    });

    it('should return falsy values as-is', () => {
      expect(decrypt(null)).toBeNull();
      expect(decrypt(undefined)).toBeUndefined();
      expect(decrypt('')).toBe('');
    });

    it('should handle special characters', () => {
      const original = 'p@$$w0rd!#%^&*()';
      const encrypted = encrypt(original);
      expect(decrypt(encrypted)).toBe(original);
    });

    it('should handle long strings', () => {
      const original = 'a'.repeat(1000);
      const encrypted = encrypt(original);
      expect(decrypt(encrypted)).toBe(original);
    });

    it('should handle unicode characters', () => {
      const original = 'こんにちは世界 🌍';
      const encrypted = encrypt(original);
      expect(decrypt(encrypted)).toBe(original);
    });
  });
});
