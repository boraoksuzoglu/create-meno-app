export default {
  transform: {},
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
  globalSetup: '<rootDir>/src/__tests__/helpers/db.js',
  globalTeardown: '<rootDir>/src/__tests__/helpers/db.teardown.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/modules/**/*.js',
    'src/middlewares/**/*.js',
    '!src/modules/**/index.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
