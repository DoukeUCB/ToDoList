import { Request, Response, NextFunction } from 'express';
import { notFound, errorHandler } from '../../src/middleware/errorHandler';

describe('ErrorHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      url: '/test-route',
      method: 'GET',
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    };

    mockNext = jest.fn();

    // Mock console.error to avoid pollution during tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('notFound', () => {
    it('should return 404 with not found message', () => {
      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Ruta no encontrada',
      });
    });

    it('should not call next function', () => {
      notFound(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('errorHandler', () => {
    it('should handle error with custom status and message', () => {
      const error = {
        status: 400,
        message: 'Bad Request Error',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error middleware:', error);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Bad Request Error',
      });
    });

    it('should handle error with default status 500 when no status provided', () => {
      const error = {
        message: 'Internal Server Error',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Internal Server Error',
      });
    });

    it('should handle error with default message when no message provided', () => {
      const error = {
        status: 422,
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error interno',
      });
    });

    it('should handle error with both default status and message', () => {
      const error = {};

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error interno',
      });
    });

    it('should not send response if headers already sent', () => {
      const error = {
        status: 400,
        message: 'Bad Request',
      };

      mockResponse.headersSent = true;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error middleware:', error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle Error instances', () => {
      const error = new Error('Test error message');
      (error as any).status = 409;

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Test error message',
      });
    });

    it('should handle string errors', () => {
      const error = 'String error message';

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error interno',
      });
    });

    it('should handle null/undefined errors', () => {
      errorHandler(null, mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Error interno',
      });
    });

    it('should log error to console', () => {
      const error = {
        status: 400,
        message: 'Test error for logging',
      };

      errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

      expect(console.error).toHaveBeenCalledWith('Error middleware:', error);
    });
  });
});