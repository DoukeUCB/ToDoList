import { Request, Response } from 'express';
import { UserController } from '../../src/controllers/UserController';
import { UserService } from '../../src/services/UserService';
import { User } from '../../src/models/User';

// Mock the UserService
jest.mock('../../src/services/UserService');

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

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockUserService = new UserService() as jest.Mocked<UserService>;
    userController = new UserController();
    (userController as any).userService = mockUserService;

    mockRequest = {
      body: {},
      session: {} as any,
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'password123',
      };

      const mockUser: User = {
        id: 1,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = userData;
      mockUserService.createUser.mockResolvedValue(mockUser);

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.createUser).toHaveBeenCalledWith(
        userData.name,
        userData.userName,
        userData.mail,
        userData.password
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Usuario registrado exitosamente',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          userName: mockUser.userName,
          mail: mockUser.mail,
          createdAt: mockUser.createdAt,
          updatedAt: mockUser.updatedAt,
        },
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        name: 'John Doe',
        // Missing userName, mail, password
      };

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.createUser).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Todos los campos son requeridos',
      });
    });

    it('should handle service errors', async () => {
      const userData = {
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'password123',
      };

      mockRequest.body = userData;
      mockUserService.createUser.mockRejectedValue(new Error('El nombre de usuario ya existe'));

      await userController.register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'El nombre de usuario ya existe',
      });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginData = {
        userName: 'johndoe',
        password: 'password123',
      };

      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.body = loginData;
      mockRequest.session = {} as any;
      mockUserService.authenticateUser.mockResolvedValue(mockUser);

      await userController.login(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockUserService.authenticateUser).toHaveBeenCalledWith(
        loginData.userName,
        loginData.password
      );
      expect(mockRequest.session!.userId).toBe(mockUser.id);
      expect(mockRequest.session!.user).toEqual({
        id: mockUser.id,
        name: mockUser.name,
        userName: mockUser.userName,
        mail: mockUser.mail,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Login exitoso',
        user: {
          id: mockUser.id,
          name: mockUser.name,
          userName: mockUser.userName,
          mail: mockUser.mail,
        },
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockRequest.body = {
        userName: 'johndoe',
        // Missing password
      };

      await userController.login(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockUserService.authenticateUser).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuario y contraseña son requeridos',
      });
    });

    it('should return 401 if authentication fails', async () => {
      const loginData = {
        userName: 'johndoe',
        password: 'wrongpassword',
      };

      mockRequest.body = loginData;
      mockUserService.authenticateUser.mockResolvedValue(null);

      await userController.login(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Credenciales inválidas',
      });
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockDestroy = jest.fn((callback: (err?: any) => void) => {
        callback();
      });

      mockRequest.session = {
        destroy: mockDestroy,
      } as any;

      await userController.logout(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockDestroy).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Logout exitoso',
      });
    });

    it('should handle session destroy error', async () => {
      const mockDestroy = jest.fn((callback: (err?: any) => void) => {
        callback(new Error('Session error'));
      });

      mockRequest.session = {
        destroy: mockDestroy,
      } as any;

      await userController.logout(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error al cerrar sesión',
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
      };

      mockRequest.session = {
        user: mockUser,
      } as any;

      await userController.getCurrentUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({
        user: mockUser,
      });
    });

    it('should return 401 if no user in session', async () => {
      mockRequest.session = {} as any;

      await userController.getCurrentUser(mockRequest as AuthenticatedRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'No hay sesión activa',
      });
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers: User[] = [
        {
          id: 1,
          name: 'John Doe',
          userName: 'johndoe',
          mail: 'john@example.com',
          password: 'hashedpassword',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockUserService.getAllUsers.mockResolvedValue(mockUsers);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getAllUsers).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        mockUsers.map(({ password, ...user }) => user)
      );
    });

    it('should handle service error', async () => {
      // Silenciar console.error durante el test
      const originalConsoleError = console.error;
      console.error = jest.fn();

      mockUserService.getAllUsers.mockRejectedValue(new Error('Database error'));

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response);

      // Restaurar console.error
      console.error = originalConsoleError;

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Error interno del servidor',
      });
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const mockUser: User = {
        id: 1,
        name: 'John Doe',
        userName: 'johndoe',
        mail: 'john@example.com',
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRequest.params = { id: '1' };
      mockUserService.getUserById.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockUserService.getUserById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith({
        id: mockUser.id,
        name: mockUser.name,
        userName: mockUser.userName,
        mail: mockUser.mail,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it('should return 400 for invalid id', async () => {
      mockRequest.params = { id: 'invalid' };

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'ID de usuario inválido',
      });
    });

    it('should return 404 if user not found', async () => {
      mockRequest.params = { id: '999' };
      mockUserService.getUserById.mockResolvedValue(null);

      await userController.getUserById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Usuario no encontrado',
      });
    });
  });
});