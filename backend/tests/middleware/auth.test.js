const jwt = require('jsonwebtoken');
const { protect, authorize, requireVerified } = require('../../src/middleware/auth');
const User = require('../../src/models/User');

jest.mock('../../src/models/User');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('protect', () => {
    it('should return 401 if no token provided', async () => {
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if authorization header has no Bearer prefix', async () => {
      req.headers.authorization = 'Token abc123';
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 for expired token', async () => {
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
      req.headers.authorization = `Bearer ${token}`;
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Token expired. Please refresh.',
      }));
    });

    it('should return 401 if user no longer exists', async () => {
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(null);
      await protect(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'User no longer exists.',
      }));
    });

    it('should call next and attach user on valid token', async () => {
      const mockUser = { _id: 'user123', name: 'Test', role: 'buyer' };
      const token = jwt.sign({ id: 'user123' }, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;
      User.findById.mockResolvedValue(mockUser);
      await protect(req, res, next);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next if user has allowed role', () => {
      req.user = { role: 'admin' };
      const middleware = authorize('admin');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user does not have allowed role', () => {
      req.user = { role: 'buyer' };
      const middleware = authorize('admin');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should accept multiple roles', () => {
      req.user = { role: 'seller' };
      const middleware = authorize('buyer', 'seller');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('requireVerified', () => {
    it('should call next if user is verified', () => {
      req.user = { verified: true };
      requireVerified(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should return 403 if user is not verified', () => {
      req.user = { verified: false };
      requireVerified(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Please verify your email before proceeding.',
      }));
    });
  });
});
