import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth } from '../../src/middleware/authMiddleware';

describe('authMiddleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    nextFunction = jest.fn();
  });

  describe('requireAuth', () => {
    it('should call next if user is authenticated', () => {
      mockRequest = {
        session: {
          userId: 1,
          user: { id: 1, name: 'Test', userName: 'testuser', mail: 'test@example.com' }
        }
      } as any;

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      mockRequest = { session: {} } as any;

      requireAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Debes estar logueado para acceder a este recurso' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should call next regardless of authentication', () => {
      optionalAuth(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});