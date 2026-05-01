const dbHandler = require('../helpers/dbHandler');
const User = require('../../src/models/User');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('User Model', () => {
  const validUser = {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'buyer',
  };

  describe('creation', () => {
    it('should create a user with valid fields', async () => {
      const user = await User.create(validUser);
      expect(user._id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.role).toBe('buyer');
      expect(user.verified).toBe(false);
    });

    it('should default role to buyer', async () => {
      const user = await User.create({ name: 'Test', email: 'test@test.com', password: 'password123' });
      expect(user.role).toBe('buyer');
    });

    it('should enforce unique email', async () => {
      await User.create(validUser);
      await expect(User.create(validUser)).rejects.toThrow();
    });

    it('should lowercase email', async () => {
      const user = await User.create({ ...validUser, email: 'JOHN@EXAMPLE.COM' });
      expect(user.email).toBe('john@example.com');
    });

    it('should require name', async () => {
      await expect(User.create({ email: 'a@b.com', password: 'password123' })).rejects.toThrow();
    });

    it('should require email', async () => {
      await expect(User.create({ name: 'Test', password: 'password123' })).rejects.toThrow();
    });

    it('should require password', async () => {
      await expect(User.create({ name: 'Test', email: 'a@b.com' })).rejects.toThrow();
    });

    it('should validate email format', async () => {
      await expect(User.create({ ...validUser, email: 'notanemail' })).rejects.toThrow();
    });

    it('should enforce minimum password length', async () => {
      await expect(User.create({ ...validUser, password: 'short' })).rejects.toThrow();
    });

    it('should reject invalid role', async () => {
      await expect(User.create({ ...validUser, role: 'superuser' })).rejects.toThrow();
    });
  });

  describe('password hashing', () => {
    it('should hash password on save', async () => {
      const user = await User.create(validUser);
      const userWithPassword = await User.findById(user._id).select('+password');
      expect(userWithPassword.password).not.toBe('password123');
      expect(userWithPassword.password.startsWith('$2a$')).toBe(true);
    });

    it('should not re-hash password if not modified', async () => {
      const user = await User.create(validUser);
      const userWithPassword = await User.findById(user._id).select('+password');
      const originalHash = userWithPassword.password;
      userWithPassword.name = 'New Name';
      await userWithPassword.save();
      const reloaded = await User.findById(user._id).select('+password');
      expect(reloaded.password).toBe(originalHash);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const user = await User.create(validUser);
      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('password123');
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create(validUser);
      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
    });
  });

  describe('toJSON', () => {
    it('should strip sensitive fields', async () => {
      const user = await User.create({ ...validUser, verificationToken: 'token123' });
      const json = user.toJSON();
      expect(json.password).toBeUndefined();
      expect(json.refreshToken).toBeUndefined();
      expect(json.verificationToken).toBeUndefined();
      expect(json.resetPasswordToken).toBeUndefined();
      expect(json.resetPasswordExpires).toBeUndefined();
      expect(json.__v).toBeUndefined();
    });

    it('should keep public fields', async () => {
      const user = await User.create(validUser);
      const json = user.toJSON();
      expect(json.name).toBe('John Doe');
      expect(json.email).toBe('john@example.com');
      expect(json._id).toBeDefined();
    });
  });
});
