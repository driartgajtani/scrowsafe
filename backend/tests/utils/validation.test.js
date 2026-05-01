const {
  registerSchema,
  loginSchema,
  createTransactionSchema,
  updateTransactionStatusSchema,
  submitCredentialsSchema,
  feeCalculateSchema,
  documentUploadSchema,
  paginationSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../../src/utils/validation');

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    it('should validate a correct registration', () => {
      const { error } = registerSchema.validate({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'buyer',
      });
      expect(error).toBeUndefined();
    });

    it('should require name', () => {
      const { error } = registerSchema.validate({ email: 'john@example.com', password: 'password123' });
      expect(error).toBeDefined();
    });

    it('should require valid email', () => {
      const { error } = registerSchema.validate({ name: 'John', email: 'invalid', password: 'password123' });
      expect(error).toBeDefined();
    });

    it('should require password min 8 chars', () => {
      const { error } = registerSchema.validate({ name: 'John', email: 'john@example.com', password: 'short' });
      expect(error).toBeDefined();
    });

    it('should reject invalid role', () => {
      const { error } = registerSchema.validate({
        name: 'John', email: 'john@example.com', password: 'password123', role: 'admin',
      });
      expect(error).toBeDefined();
    });

    it('should default role to buyer', () => {
      const { value } = registerSchema.validate({ name: 'John', email: 'john@example.com', password: 'password123' });
      expect(value.role).toBe('buyer');
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login', () => {
      const { error } = loginSchema.validate({ email: 'john@example.com', password: 'pass123' });
      expect(error).toBeUndefined();
    });

    it('should require email', () => {
      const { error } = loginSchema.validate({ password: 'pass123' });
      expect(error).toBeDefined();
    });

    it('should require password', () => {
      const { error } = loginSchema.validate({ email: 'john@example.com' });
      expect(error).toBeDefined();
    });
  });

  describe('createTransactionSchema', () => {
    const valid = {
      counterpartyEmail: 'seller@example.com',
      platform: 'instagram',
      amount: 500,
      role: 'buyer',
    };

    it('should validate a correct transaction', () => {
      const { error } = createTransactionSchema.validate(valid);
      expect(error).toBeUndefined();
    });

    it('should require counterpartyEmail', () => {
      const { error } = createTransactionSchema.validate({ ...valid, counterpartyEmail: undefined });
      expect(error).toBeDefined();
    });

    it('should require valid platform', () => {
      const { error } = createTransactionSchema.validate({ ...valid, platform: 'myspace' });
      expect(error).toBeDefined();
    });

    it('should require amount >= 1', () => {
      const { error } = createTransactionSchema.validate({ ...valid, amount: 0 });
      expect(error).toBeDefined();
    });

    it('should require role', () => {
      const { error } = createTransactionSchema.validate({ ...valid, role: undefined });
      expect(error).toBeDefined();
    });

    it('should accept optional fields', () => {
      const { error } = createTransactionSchema.validate({
        ...valid,
        accountUsername: 'testuser',
        accountDescription: 'test desc',
        paymentMethod: 'crypto',
      });
      expect(error).toBeUndefined();
    });
  });

  describe('updateTransactionStatusSchema', () => {
    it('should validate valid status', () => {
      const { error } = updateTransactionStatusSchema.validate({ status: 'completed' });
      expect(error).toBeUndefined();
    });

    it('should reject invalid status', () => {
      const { error } = updateTransactionStatusSchema.validate({ status: 'invalid_status' });
      expect(error).toBeDefined();
    });

    it('should accept optional adminNotes', () => {
      const { error } = updateTransactionStatusSchema.validate({ status: 'pending', adminNotes: 'note' });
      expect(error).toBeUndefined();
    });
  });

  describe('submitCredentialsSchema', () => {
    it('should validate correct credentials', () => {
      const { error } = submitCredentialsSchema.validate({
        credentials: 'user:pass',
        payoutInfo: 'paypal@example.com',
      });
      expect(error).toBeUndefined();
    });

    it('should require credentials', () => {
      const { error } = submitCredentialsSchema.validate({ payoutInfo: 'paypal@example.com' });
      expect(error).toBeDefined();
    });

    it('should require payoutInfo', () => {
      const { error } = submitCredentialsSchema.validate({ credentials: 'user:pass' });
      expect(error).toBeDefined();
    });
  });

  describe('feeCalculateSchema', () => {
    it('should validate correct fee request', () => {
      const { error } = feeCalculateSchema.validate({ platform: 'tiktok', amount: 100 });
      expect(error).toBeUndefined();
    });

    it('should reject invalid platform', () => {
      const { error } = feeCalculateSchema.validate({ platform: 'unknown', amount: 100 });
      expect(error).toBeDefined();
    });

    it('should reject amount < 1', () => {
      const { error } = feeCalculateSchema.validate({ platform: 'tiktok', amount: 0 });
      expect(error).toBeDefined();
    });
  });

  describe('documentUploadSchema', () => {
    it('should validate correct type', () => {
      const { error } = documentUploadSchema.validate({ type: 'id' });
      expect(error).toBeUndefined();
    });

    it('should reject invalid type', () => {
      const { error } = documentUploadSchema.validate({ type: 'selfie' });
      expect(error).toBeDefined();
    });
  });

  describe('paginationSchema', () => {
    it('should use defaults for empty input', () => {
      const { value, error } = paginationSchema.validate({});
      expect(error).toBeUndefined();
      expect(value.page).toBe(1);
      expect(value.limit).toBe(20);
      expect(value.sort).toBe('-createdAt');
    });

    it('should reject page < 1', () => {
      const { error } = paginationSchema.validate({ page: 0 });
      expect(error).toBeDefined();
    });

    it('should reject limit > 100', () => {
      const { error } = paginationSchema.validate({ limit: 200 });
      expect(error).toBeDefined();
    });
  });

  describe('updateProfileSchema', () => {
    it('should validate name update', () => {
      const { error } = updateProfileSchema.validate({ name: 'New Name' });
      expect(error).toBeUndefined();
    });

    it('should require at least one field', () => {
      const { error } = updateProfileSchema.validate({});
      expect(error).toBeDefined();
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate correct password change', () => {
      const { error } = changePasswordSchema.validate({ currentPassword: 'old123', newPassword: 'newpass123' });
      expect(error).toBeUndefined();
    });

    it('should reject short new password', () => {
      const { error } = changePasswordSchema.validate({ currentPassword: 'old', newPassword: 'short' });
      expect(error).toBeDefined();
    });
  });

  describe('forgotPasswordSchema', () => {
    it('should validate email', () => {
      const { error } = forgotPasswordSchema.validate({ email: 'user@example.com' });
      expect(error).toBeUndefined();
    });

    it('should reject invalid email', () => {
      const { error } = forgotPasswordSchema.validate({ email: 'notanemail' });
      expect(error).toBeDefined();
    });
  });

  describe('resetPasswordSchema', () => {
    it('should validate correct reset', () => {
      const { error } = resetPasswordSchema.validate({ token: 'abc123', password: 'newpass123' });
      expect(error).toBeUndefined();
    });

    it('should require token', () => {
      const { error } = resetPasswordSchema.validate({ password: 'newpass123' });
      expect(error).toBeDefined();
    });

    it('should reject short password', () => {
      const { error } = resetPasswordSchema.validate({ token: 'abc', password: 'short' });
      expect(error).toBeDefined();
    });
  });
});
