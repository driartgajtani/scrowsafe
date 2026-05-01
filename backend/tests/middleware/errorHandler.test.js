const errorHandler = require('../../src/middleware/errorHandler');

describe('errorHandler', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('should handle Mongoose ValidationError', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: { message: 'Email is required' },
        name: { message: 'Name is required' },
      },
    };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: false,
      message: 'Validation failed',
      errors: expect.arrayContaining(['Email is required', 'Name is required']),
    }));
  });

  it('should handle duplicate key error (code 11000)', () => {
    const err = { code: 11000, keyValue: { email: 'test@test.com' } };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('Duplicate value for email'),
    }));
  });

  it('should handle CastError', () => {
    const err = { name: 'CastError', path: '_id', value: 'invalid-id' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid _id: invalid-id',
    }));
  });

  it('should handle JsonWebTokenError', () => {
    const err = { name: 'JsonWebTokenError', message: 'jwt malformed' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Invalid token.',
    }));
  });

  it('should handle TokenExpiredError', () => {
    const err = { name: 'TokenExpiredError', message: 'jwt expired' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Token expired.',
    }));
  });

  it('should handle generic error with statusCode', () => {
    const err = { statusCode: 422, message: 'Unprocessable' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Unprocessable',
    }));
  });

  it('should default to 500 for unknown errors', () => {
    const err = { message: 'Something broke' };
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('should default message to Internal server error', () => {
    const err = {};
    errorHandler(err, req, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Internal server error',
    }));
  });
});
