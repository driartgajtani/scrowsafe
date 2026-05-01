const mongoose = require('mongoose');
const env = require('../../src/config/env');
const authController = require('../../src/controllers/authController');
const User = require('../../src/models/User');
const { sendMail } = require('../../src/utils/mailer');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../src/utils/tokenHelper');

jest.mock('../../src/models/User');
jest.mock('../../src/utils/mailer');
jest.mock('../../src/utils/tokenHelper');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {}, user: { _id: 'user123' } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    beforeEach(() => {
      req.body = { name: 'John', email: 'john@example.com', password: 'password123', role: 'buyer' };
    });

    it('should return 400 if email already exists', async () => {
      User.findOne.mockResolvedValue({ _id: 'existing' });
      await authController.register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should create user and return tokens when verification disabled', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => {
        if (key === 'REQUIRE_EMAIL_VERIFICATION') return false;
        if (key === 'CLIENT_URL') return 'http://localhost:4200';
        return env.getAll()[key];
      });
      const mockUser = {
        _id: 'newuser',
        toJSON: () => ({ _id: 'newuser', name: 'John', email: 'john@example.com' }),
        save: jest.fn(),
      };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      generateAccessToken.mockReturnValue('access-token');
      generateRefreshToken.mockReturnValue('refresh-token');

      await authController.register(req, res, next);

      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({ accessToken: 'access-token' }),
      }));
      env.get.mockRestore();
    });

    it('should send verification email when verification enabled', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => {
        if (key === 'REQUIRE_EMAIL_VERIFICATION') return true;
        if (key === 'CLIENT_URL') return 'http://localhost:4200';
        return env.getAll()[key];
      });
      const mockUser = { _id: 'newuser', save: jest.fn() };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);
      sendMail.mockResolvedValue({ messageId: 'msg1' });

      await authController.register(req, res, next);

      expect(sendMail).toHaveBeenCalledWith('john@example.com', expect.any(String), expect.any(String));
      expect(res.status).toHaveBeenCalledWith(201);
      env.get.mockRestore();
    });

    it('should call next on error', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));
      await authController.register(req, res, next);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('login', () => {
    beforeEach(() => {
      req.body = { email: 'john@example.com', password: 'password123' };
    });

    it('should return 401 if user not found', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 if password does not match', async () => {
      const mockUser = { comparePassword: jest.fn().mockResolvedValue(false) };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if email not verified', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => {
        if (key === 'REQUIRE_EMAIL_VERIFICATION') return true;
        return env.getAll()[key];
      });
      const mockUser = { comparePassword: jest.fn().mockResolvedValue(true), verified: false };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      env.get.mockRestore();
    });

    it('should return tokens on successful login', async () => {
      jest.spyOn(env, 'get').mockImplementation((key) => {
        if (key === 'REQUIRE_EMAIL_VERIFICATION') return false;
        return env.getAll()[key];
      });
      const mockUser = {
        _id: 'user1',
        comparePassword: jest.fn().mockResolvedValue(true),
        verified: true,
        toJSON: () => ({ _id: 'user1', name: 'John' }),
        save: jest.fn(),
      };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      generateAccessToken.mockReturnValue('access');
      generateRefreshToken.mockReturnValue('refresh');

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ accessToken: 'access', refreshToken: 'refresh' }),
      }));
      env.get.mockRestore();
    });

    it('should call next on error', async () => {
      User.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      await authController.login(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should return 400 if no refresh token provided', async () => {
      req.body = {};
      await authController.refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if token is invalid', async () => {
      req.body = { refreshToken: 'old-token' };
      verifyRefreshToken.mockReturnValue({ id: 'user1' });
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ refreshToken: 'different-token' }) });
      await authController.refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return new tokens on valid refresh', async () => {
      req.body = { refreshToken: 'valid-token' };
      verifyRefreshToken.mockReturnValue({ id: 'user1' });
      const mockUser = { _id: 'user1', refreshToken: 'valid-token', save: jest.fn() };
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      generateAccessToken.mockReturnValue('new-access');
      generateRefreshToken.mockReturnValue('new-refresh');

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 on expired refresh token', async () => {
      req.body = { refreshToken: 'expired' };
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      verifyRefreshToken.mockImplementation(() => { throw err; });
      await authController.refreshToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should call next on generic error', async () => {
      req.body = { refreshToken: 'token' };
      verifyRefreshToken.mockImplementation(() => { throw new Error('generic error'); });
      await authController.refreshToken(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clear refresh token and respond success', async () => {
      const mockUser = { refreshToken: 'token', save: jest.fn() };
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.logout(req, res, next);
      expect(mockUser.refreshToken).toBeNull();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      User.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      await authController.logout(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getMe', () => {
    it('should return current user', async () => {
      req.user = { _id: 'user1', name: 'John' };
      await authController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        data: { user: req.user },
      }));
    });
  });

  describe('verifyEmail', () => {
    it('should return 400 for invalid token', async () => {
      req.params = { token: 'invalid' };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await authController.verifyEmail(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should verify user on valid token', async () => {
      req.params = { token: 'valid-token' };
      const mockUser = { verified: false, save: jest.fn() };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.verifyEmail(req, res, next);
      expect(mockUser.verified).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.params = { token: 'token' };
      User.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      await authController.verifyEmail(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('should respond success even if user not found (security)', async () => {
      req.body = { email: 'unknown@example.com' };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await authController.resendVerification(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should send email for unverified user', async () => {
      req.body = { email: 'user@example.com' };
      const mockUser = { verified: false, save: jest.fn() };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      sendMail.mockResolvedValue({});
      await authController.resendVerification(req, res, next);
      expect(sendMail).toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      req.body = { email: 'user@example.com' };
      User.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      await authController.resendVerification(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update name', async () => {
      req.body = { name: 'New Name' };
      const mockUser = { _id: 'user123', name: 'Old', email: 'a@b.com', save: jest.fn(), toJSON: () => ({ name: 'New Name' }) };
      User.findById.mockResolvedValue(mockUser);
      await authController.updateProfile(req, res, next);
      expect(mockUser.name).toBe('New Name');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if new email is taken', async () => {
      req.body = { email: 'taken@example.com' };
      const mockUser = { _id: 'user123', email: 'old@example.com', save: jest.fn() };
      User.findById.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue({ _id: 'other' });
      await authController.updateProfile(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should update email if not taken', async () => {
      req.body = { email: 'new@example.com' };
      const mockUser = { _id: 'user123', email: 'old@example.com', save: jest.fn(), toJSON: () => ({ email: 'new@example.com' }) };
      User.findById.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null);
      await authController.updateProfile(req, res, next);
      expect(mockUser.email).toBe('new@example.com');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.body = { name: 'Test' };
      User.findById.mockRejectedValue(new Error('DB error'));
      await authController.updateProfile(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('should return 400 if current password is wrong', async () => {
      req.body = { currentPassword: 'wrong', newPassword: 'newpass123' };
      const mockUser = { comparePassword: jest.fn().mockResolvedValue(false) };
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.changePassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should change password on valid current password', async () => {
      req.body = { currentPassword: 'correct', newPassword: 'newpass123' };
      const mockUser = { comparePassword: jest.fn().mockResolvedValue(true), save: jest.fn() };
      User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.changePassword(req, res, next);
      expect(mockUser.password).toBe('newpass123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.body = { currentPassword: 'test', newPassword: 'new' };
      User.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      await authController.changePassword(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should respond success even if user not found', async () => {
      req.body = { email: 'unknown@test.com' };
      User.findOne.mockResolvedValue(null);
      await authController.forgotPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should send reset email for valid user', async () => {
      req.body = { email: 'user@test.com' };
      const mockUser = { email: 'user@test.com', save: jest.fn() };
      User.findOne.mockResolvedValue(mockUser);
      sendMail.mockResolvedValue({});
      await authController.forgotPassword(req, res, next);
      expect(sendMail).toHaveBeenCalled();
    });

    it('should call next on error', async () => {
      req.body = { email: 'user@test.com' };
      User.findOne.mockRejectedValue(new Error('DB error'));
      await authController.forgotPassword(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should return 400 for invalid/expired token', async () => {
      req.body = { token: 'invalid', password: 'newpass123' };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
      await authController.resetPassword(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reset password on valid token', async () => {
      req.body = { token: 'valid', password: 'newpass123' };
      const mockUser = { save: jest.fn() };
      User.findOne.mockReturnValue({ select: jest.fn().mockResolvedValue(mockUser) });
      await authController.resetPassword(req, res, next);
      expect(mockUser.password).toBe('newpass123');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.body = { token: 'token', password: 'pass' };
      User.findOne.mockReturnValue({ select: jest.fn().mockRejectedValue(new Error('DB error')) });
      await authController.resetPassword(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
