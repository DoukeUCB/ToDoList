import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

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

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, userName, mail, password } = req.body;

      if (!name || !userName || !mail || !password) {
        res.status(400).json({ error: 'Todos los campos son requeridos' });
        return;
      }

      const user = await this.userService.createUser(name, userName, mail, password);
      
      // No incluir la contraseña en la respuesta
      const { password: _, ...userResponse } = user;
      
      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: userResponse
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { userName, password } = req.body;

      if (!userName || !password) {
        res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
        return;
      }

      const user = await this.userService.authenticateUser(userName, password);
      
      if (!user) {
        res.status(401).json({ error: 'Credenciales inválidas' });
        return;
      }

      // Crear sesión
      req.session.userId = user.id;
      req.session.user = {
        id: user.id,
        name: user.name,
        userName: user.userName,
        mail: user.mail
      };

      res.json({
        message: 'Login exitoso',
        user: {
          id: user.id,
          name: user.name,
          userName: user.userName,
          mail: user.mail
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      req.session.destroy((err) => {
        if (err) {
          res.status(500).json({ error: 'Error al cerrar sesión' });
          return;
        }
        res.json({ message: 'Logout exitoso' });
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.session.user) {
        res.status(401).json({ error: 'No hay sesión activa' });
        return;
      }

      res.json({ user: req.session.user });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const users = await this.userService.getAllUsers();
      const usersResponse = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      res.json(usersResponse);
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      const user = await this.userService.getUserById(id);
      
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      const { password, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      // Verificar que el usuario solo pueda actualizar su propia información
      if (req.session.userId !== id) {
        res.status(403).json({ error: 'No tienes permisos para actualizar este usuario' });
        return;
      }

      const { name, userName, mail, password } = req.body;

      const updatedUser = await this.userService.updateUser(id, name, userName, mail, password);
      
      if (!updatedUser) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Actualizar sesión si se cambió información básica
      if (name || userName || mail) {
        req.session.user = {
          id: updatedUser.id,
          name: updatedUser.name,
          userName: updatedUser.userName,
          mail: updatedUser.mail
        };
      }

      const { password: _, ...userResponse } = updatedUser;
      res.json({
        message: 'Usuario actualizado exitosamente',
        user: userResponse
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Error interno del servidor' });
      }
    }
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de usuario inválido' });
        return;
      }

      if (req.session.userId !== id) {
        res.status(403).json({ error: 'No tienes permisos para eliminar este usuario' });
        return;
      }

      const deleted = await this.userService.deleteUser(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Destruir sesión después de eliminar cuenta
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al destruir sesión:', err);
        }
      });

      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
}
