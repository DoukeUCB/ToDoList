import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth } from '../../src/middleware/authMiddleware';

interface AuthenticatedRequest extends Request {
  session: Request['session'] & {
    userId?: number;
    user?: {
      id: number;
      name: string;
      userName: string;
      mail: string;
    };
  };
}

describe('AuthMiddleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockRequest = {
      session: {} as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should call next when user is authenticated', () => {
      mockRequest.session = {
        userId: 1,
        user: {
          id: 1,
          name: 'Test User',
          userName: 'testuser',
          mail: 'test@example.com',
        },
      } as any;

      requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should return 401 when userId is missing', () => {
      mockRequest.session = {
        user: {
          id: 1,
          name: 'Test User',
          userName: 'testuser',
          mail: 'test@example.com',
        },
      } as any;

      requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Debes estar logueado para acceder a este recurso',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when user is missing', () => {
      mockRequest.session = {
        userId: 1,
      } as any;

      requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Debes estar logueado para acceder a este recurso',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when both userId and user are missing', () => {
      mockRequest.session = {} as any;

      requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Debes estar logueado para acceder a este recurso',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when session is undefined', () => {
      mockRequest.session = undefined;

      requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Debes estar logueado para acceder a este recurso',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('optionalAuth', () => {
    it('should always call next regardless of authentication status', () => {
      // Test with authenticated user
      mockRequest.session = {
        userId: 1,
        user: {
          id: 1,
          name: 'Test User',
          userName: 'testuser',
          mail: 'test@example.com',
        },
      } as any;

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next even when not authenticated', () => {
      mockRequest.session = {} as any;

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next even when session is undefined', () => {
      mockRequest.session = undefined;

      optionalAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});