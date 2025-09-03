import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.findAll();
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findById(id);
  }

  async getUserByUserName(userName: string): Promise<User | null> {
    return await this.userRepository.findByUserName(userName);
  }

  async createUser(name: string, userName: string, mail: string, password: string): Promise<User> {
    // Verificar si el usuario o email ya existen
    const existingUserByUserName = await this.userRepository.findByUserName(userName);
    if (existingUserByUserName) {
      throw new Error('El nombre de usuario ya existe');
    }

    const existingUserByMail = await this.userRepository.findByMail(mail);
    if (existingUserByMail) {
      throw new Error('El email ya está registrado');
    }

    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    return await this.userRepository.create({
      name,
      userName,
      mail,
      password: hashedPassword
    });
  }

  async updateUser(id: number, name?: string, userName?: string, mail?: string, password?: string): Promise<User | null> {
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (userName !== undefined) {
      // Verificar que el nuevo userName no esté en uso
      const existingUser = await this.userRepository.findByUserName(userName);
      if (existingUser && existingUser.id !== id) {
        throw new Error('El nombre de usuario ya existe');
      }
      updateData.userName = userName;
    }
    if (mail !== undefined) {
      // Verificar que el nuevo email no esté en uso
      const existingUser = await this.userRepository.findByMail(mail);
      if (existingUser && existingUser.id !== id) {
        throw new Error('El email ya está registrado');
      }
      updateData.mail = mail;
    }
    if (password !== undefined) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }

    return await this.userRepository.update(id, updateData);
  }

  async deleteUser(id: number): Promise<boolean> {
    return await this.userRepository.delete(id);
  }

  async authenticateUser(userName: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByUserName(userName);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
