export const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

export const mockDataSource = {
  getRepository: jest.fn(() => mockRepository),
  initialize: jest.fn(),
  isInitialized: true,
};

export const AppDataSource = mockDataSource;