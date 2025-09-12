import request from 'supertest';
import express from 'express';
import userRoutes from '../../src/routes/userRoutes';

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

// Mock de los controladores
jest.mock('../../src/controllers/UserController', () => {
  return {
    UserController: jest.fn().mockImplementation(() => ({
      register: jest.fn((req, res) => res.status(201).json({ message: 'User registered' })),
      login: jest.fn((req, res) => res.status(200).json({ message: 'Login successful' })),
      logout: jest.fn((req, res) => res.status(200).json({ message: 'Logout successful' })),
      getCurrentUser: jest.fn((req, res) => res.status(200).json({ user: { id: 1, name: 'Test User' } })),
      getAllUsers: jest.fn((req, res) => res.status(200).json([{ id: 1, name: 'Test User' }])),
      getUserById: jest.fn((req, res) => res.status(200).json({ id: 1, name: 'Test User' })),
      updateUser: jest.fn((req, res) => res.status(200).json({ id: 1, name: 'Updated User' })),
      deleteUser: jest.fn((req, res) => res.status(204).send()),
    }))
  };
});

describe('User Routes', () => {
  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          name: 'Test User',
          userName: 'testuser',
          mail: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered');
    });
  });

  describe('POST /api/users/login', () => {
    it('should login a user', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          userName: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login successful');
    });
  });

  describe('POST /api/users/logout', () => {
    it('should logout a user', async () => {
      const response = await request(app)
        .post('/api/users/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('GET /api/users/me', () => {
    it('should get current user', async () => {
      const response = await request(app)
        .get('/api/users/me');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({ id: 1, name: 'Test User' });
    });
  });

  describe('GET /api/users', () => {
    it('should get all users', async () => {
      const response = await request(app)
        .get('/api/users');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const response = await request(app)
        .get('/api/users/1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, name: 'Test User' });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .send({
          name: 'Updated User',
          mail: 'updated@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ id: 1, name: 'Updated User' });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const response = await request(app)
        .delete('/api/users/1');

      expect(response.status).toBe(204);
    });
  });
});