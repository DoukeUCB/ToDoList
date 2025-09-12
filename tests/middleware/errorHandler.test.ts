import { Request, Response, NextFunction } from 'express';
import { notFound, errorHandler } from '../../src/middleware/errorHandler';

describe('errorHandler middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      headersSent: false
    };
    nextFunction = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('notFound', () => {
    it('should return 404 for unknown routes', () => {
      notFound(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Ruta no encontrada' });
    });
  });

  describe('errorHandler', () => {
    it('should handle errors and return the correct status and message', () => {
      const error = new Error('Test error');
      (error as any).status = 400;

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error middleware:', error);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Test error' });
    });

    it('should handle generic errors with status 500', () => {
      const error = new Error('Generic error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error middleware:', error);
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Generic error' });
    });

    it('should not handle errors if headers are already sent', () => {
      mockResponse.headersSent = true;
      const error = new Error('Headers sent error');

      errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error middleware:', error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });
});