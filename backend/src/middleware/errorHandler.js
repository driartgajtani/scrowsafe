const ApiResponse = require('../utils/apiResponse');

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return ApiResponse.badRequest(res, 'Validation failed', messages);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.badRequest(res, `Duplicate value for ${field}. This ${field} is already in use.`);
  }

  if (err.name === 'CastError') {
    return ApiResponse.badRequest(res, `Invalid ${err.path}: ${err.value}`);
  }

  if (err.name === 'JsonWebTokenError') {
    return ApiResponse.unauthorized(res, 'Invalid token.');
  }

  if (err.name === 'TokenExpiredError') {
    return ApiResponse.unauthorized(res, 'Token expired.');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  return ApiResponse.error(res, message, statusCode);
};

module.exports = errorHandler;
