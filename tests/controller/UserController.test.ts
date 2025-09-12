import { Request, Response } from 'express';
import { UserController } from '../../src/controllers/UserController';
import { UserService } from '../../src/services/UserService';
import { User } from '../../src/models/User';

jest.mock('../../src/services/UserService');

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

  describe('logout', () => {
    it('should log out successfully', async () => {
      mockRequest = {
        session: {
          destroy: jest.fn((callback) => callback(null))
        } as any
      };

      await userController.logout(mockRequest as any, mockResponse as Response);

      expect((mockRequest.session as any).destroy).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Logout exitoso' });
    });

    it('should handle errors during logout', async () => {
      mockRequest = {
        session: {
          destroy: jest.fn((callback) => callback(new Error('Logout error')))
        } as any
      };

      await userController.logout(mockRequest as any, mockResponse as Response);

      expect((mockRequest.session as any).destroy).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Error al cerrar sesión' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return the current user if session is active', async () => {
      mockRequest = {
        session: {
          user: { id: 1, name: 'Test', userName: 'testuser', mail: 'test@example.com' }
        } as any
      };

      await userController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith({ user: (mockRequest.session as any).user });
    });

    it('should return 401 if no active session', async () => {
      mockRequest = { session: {} as any };

      await userController.getCurrentUser(mockRequest as any, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No hay sesión activa' });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updatedUser = { id: 1, name: 'Updated', userName: 'updateduser', mail: 'updated@example.com', password: 'password', createdAt: new Date(), updatedAt: new Date() };
      mockRequest = {
        params: { id: '1' },
        body: { name: 'Updated', userName: 'updateduser', mail: 'updated@example.com' },
        session: { userId: 1 } as any
      };
      mockService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      const { password, ...expectedUser } = updatedUser;
      expect(mockService.updateUser).toHaveBeenCalledWith(1, 'Updated', 'updateduser', 'updated@example.com', undefined);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Usuario actualizado exitosamente',
        user: expectedUser
      });
    });

    it('should return 403 if user tries to update another user', async () => {
      mockRequest = {
        params: { id: '2' },
        session: { userId: 1 } as any
      };

      await userController.updateUser(mockRequest as any, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No tienes permisos para actualizar este usuario' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockRequest = {
        params: { id: '1' },
        session: { userId: 1, destroy: jest.fn((callback) => callback(null)) } as any
      };
      mockService.deleteUser.mockResolvedValue(true);

      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(mockService.deleteUser).toHaveBeenCalledWith(1);
      expect((mockRequest.session as any).destroy).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Usuario eliminado exitosamente' });
    });

    it('should return 403 if user tries to delete another user', async () => {
      mockRequest = {
        params: { id: '2' },
        session: { userId: 1 } as any
      };

      await userController.deleteUser(mockRequest as any, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'No tienes permisos para eliminar este usuario' });
    });
  });
});