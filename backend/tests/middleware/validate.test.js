const Joi = require('joi');
const { validate, validateQuery } = require('../../src/middleware/validate');

describe('Validate Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('validate (body)', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().min(0),
    });

    it('should call next on valid body', () => {
      req.body = { name: 'John', age: 25 };
      validate(schema)(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should strip unknown fields', () => {
      req.body = { name: 'John', unknown: 'field' };
      validate(schema)(req, res, next);
      expect(req.body).toEqual({ name: 'John' });
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 on validation error', () => {
      req.body = { age: -1 };
      validate(schema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array),
      }));
      expect(next).not.toHaveBeenCalled();
    });

    it('should return all validation errors (abortEarly: false)', () => {
      req.body = {};
      validate(schema)(req, res, next);
      const response = res.json.mock.calls[0][0];
      expect(response.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateQuery', () => {
    const schema = Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    });

    it('should call next on valid query', () => {
      req.query = { page: '2', limit: '10' };
      validateQuery(schema)(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(2);
      expect(req.query.limit).toBe(10);
    });

    it('should apply defaults for empty query', () => {
      req.query = {};
      validateQuery(schema)(req, res, next);
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(20);
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 on invalid query', () => {
      req.query = { page: '-1' };
      validateQuery(schema)(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
