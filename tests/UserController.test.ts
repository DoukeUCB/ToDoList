import { Request, Response } from 'express';
import { UserController } from '../src/controllers/UserController';
import { UserService } from '../src/services/UserService';
import { User } from '../src/models/User';

jest.mock('../src/services/UserService');

const mockUserService = UserService as jest.MockedClass<typeof UserService>;

describe('UserController', () => {
  let userController: UserController;
  let mockService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    mockService = new mockUserService() as jest.Mocked<UserService>;
    userController = new UserController();
    (userController as any).userService = mockService;

    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockResponse = {
      status: statusMock,
      json: jsonMock
    };

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = { name: 'Test', userName: 'testuser', mail: 'test@example.com', password: 'password' };
      const createdUser: User = { id: 1, ...userData } as User;
      mockRequest = { body: userData };
      mockService.createUser.mockResolvedValue(createdUser);

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(mockService.createUser).toHaveBeenCalledWith(userData.name, userData.userName, userData.mail, userData.password);
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Usuario registrado exitosamente',
        user: { id: 1, name: 'Test', userName: 'testuser', mail: 'test@example.com' }
      });
    });

    it('should return 400 if fields are missing', async () => {
      mockRequest = { body: { name: 'Test' } };

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Todos los campos son requeridos' });
    });

    it('should return 400 if user creation fails', async () => {
      const userData = { name: 'Test', userName: 'testuser', mail: 'test@example.com', password: 'password' };
      mockRequest = { body: userData };
      mockService.createUser.mockRejectedValue(new Error('Username exists'));

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Username exists' });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = { userName: 'testuser', password: 'password' };
      const user: User = { id: 1, name: 'Test', userName: 'testuser', mail: 'test@example.com' } as User;
      mockRequest = {
        body: loginData,
        session: {
          userId: undefined,
          user: undefined,
          id: 'test',
          cookie: {} as any,
          regenerate: jest.fn(),
          destroy: jest.fn(),
          reload: jest.fn(),
          resetMaxAge: jest.fn(),
          save: jest.fn(),
          touch: jest.fn()
        } as any
      };
      mockService.authenticateUser.mockResolvedValue(user);

      await userController.login(mockRequest as any, mockResponse as Response);

      expect(mockService.authenticateUser).toHaveBeenCalledWith(loginData.userName, loginData.password);
      expect((mockRequest as any).session.userId).toBe(1);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Login exitoso',
        user: { id: 1, name: 'Test', userName: 'testuser', mail: 'test@example.com' }
      });
    });

    it('should return 400 if credentials are missing', async () => {
      mockRequest = { body: { userName: 'testuser' }, session: {
        userId: undefined,
        user: undefined,
        id: 'test',
        cookie: {} as any,
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        resetMaxAge: jest.fn(),
        save: jest.fn(),
        touch: jest.fn()
      } as any };

      await userController.login(mockRequest as any, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Usuario y contraseña son requeridos' });
    });

    it('should return 401 if authentication fails', async () => {
      const loginData = { userName: 'testuser', password: 'wrongpassword' };
      mockRequest = { body: loginData, session: {
        userId: undefined,
        user: undefined,
        id: 'test',
        cookie: {} as any,
        regenerate: jest.fn(),
        destroy: jest.fn(),
        reload: jest.fn(),
        resetMaxAge: jest.fn(),
        save: jest.fn(),
        touch: jest.fn()
      } as any };
      mockService.authenticateUser.mockResolvedValue(null);

      await userController.login(mockRequest as any, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
    });
  });
});