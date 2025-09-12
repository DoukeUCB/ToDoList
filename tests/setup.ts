import 'reflect-metadata';

jest.mock('typeorm', () => ({
  Entity: jest.fn(() => jest.fn()),
  PrimaryGeneratedColumn: jest.fn(() => jest.fn()),
  Column: jest.fn(() => jest.fn()),
  CreateDateColumn: jest.fn(() => jest.fn()),
  UpdateDateColumn: jest.fn(() => jest.fn()),
  ManyToOne: jest.fn(() => jest.fn()),
  OneToMany: jest.fn(() => jest.fn()),
  JoinColumn: jest.fn(() => jest.fn()),
  Repository: jest.fn(),
  IsNull: jest.fn(),
}));

jest.mock('../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
    initialize: jest.fn(),
    isInitialized: true,
  },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});