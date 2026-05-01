const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const env = require('../config/env');

const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return ApiResponse.unauthorized(res, 'Access denied. No token provided.');
    }

    const decoded = jwt.verify(token, env.get('JWT_SECRET'));
    const user = await User.findById(decoded.id);

    if (!user) {
      return ApiResponse.unauthorized(res, 'User no longer exists.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expired. Please refresh.');
    }
    return ApiResponse.unauthorized(res, 'Invalid token.');
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.forbidden(res, 'You do not have permission to perform this action.');
    }
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (!req.user.verified) {
    return ApiResponse.forbidden(res, 'Please verify your email before proceeding.');
  }
  next();
};

module.exports = { protect, authorize, requireVerified };
