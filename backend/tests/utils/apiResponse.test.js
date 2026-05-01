const ApiResponse = require('../../src/utils/apiResponse');

describe('ApiResponse', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('success', () => {
    it('should return 200 with success response', () => {
      ApiResponse.success(res, { id: 1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data: { id: 1 },
      });
    });

    it('should accept custom message and status code', () => {
      ApiResponse.success(res, null, 'Custom message', 202);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Custom message',
        data: null,
      });
    });
  });

  describe('created', () => {
    it('should return 201 with created response', () => {
      ApiResponse.created(res, { id: 1 });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Created successfully',
        data: { id: 1 },
      });
    });

    it('should accept custom message', () => {
      ApiResponse.created(res, { id: 1 }, 'Item created');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Item created',
        data: { id: 1 },
      });
    });
  });

  describe('error', () => {
    it('should return 500 with error response by default', () => {
      ApiResponse.error(res);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
      });
    });

    it('should include errors array when provided', () => {
      ApiResponse.error(res, 'Bad data', 422, ['field is required']);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad data',
        errors: ['field is required'],
      });
    });

    it('should not include errors key when errors is null', () => {
      ApiResponse.error(res, 'Error', 500, null);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall).not.toHaveProperty('errors');
    });
  });

  describe('badRequest', () => {
    it('should return 400', () => {
      ApiResponse.badRequest(res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Bad request',
      });
    });

    it('should accept custom message and errors', () => {
      ApiResponse.badRequest(res, 'Invalid input', ['email is required']);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
        errors: ['email is required'],
      });
    });
  });

  describe('unauthorized', () => {
    it('should return 401', () => {
      ApiResponse.unauthorized(res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
      });
    });

    it('should accept custom message', () => {
      ApiResponse.unauthorized(res, 'Token expired');
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token expired',
      });
    });
  });

  describe('forbidden', () => {
    it('should return 403', () => {
      ApiResponse.forbidden(res);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Forbidden',
      });
    });
  });

  describe('notFound', () => {
    it('should return 404', () => {
      ApiResponse.notFound(res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
      });
    });

    it('should accept custom message', () => {
      ApiResponse.notFound(res, 'User not found');
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not found',
      });
    });
  });
});
