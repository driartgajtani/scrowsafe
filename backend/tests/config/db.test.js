jest.mock('mongoose', () => ({
  connect: jest.fn(),
}));

jest.mock('../../src/config/env', () => ({
  get: jest.fn((key) => {
    if (key === 'MONGO_URI') return 'mongodb://localhost:27017/test';
    return undefined;
  }),
  isResolved: true,
}));

describe('connectDB', () => {
  let mockExit;
  let connectDB;
  const mongoose = require('mongoose');

  beforeEach(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
    connectDB = require('../../src/config/db');
  });

  afterEach(() => {
    mockExit.mockRestore();
    console.log.mockRestore();
    console.error.mockRestore();
  });

  it('should connect to MongoDB successfully', async () => {
    mongoose.connect.mockResolvedValue({ connection: { host: 'localhost' } });
    await connectDB();
    expect(mongoose.connect).toHaveBeenCalledWith('mongodb://localhost:27017/test', expect.any(Object));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('MongoDB connected'));
  });

  it('should exit process on connection failure', async () => {
    mongoose.connect.mockRejectedValue(new Error('Connection failed'));
    await connectDB();
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Connection failed'));
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
