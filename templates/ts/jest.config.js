export default {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // TS ESM imports keep the .js extension (e.g. '@/utils/x.js') but the source
    // is x.ts — strip .js so jest resolves the .ts file via moduleFileExtensions.
    '^@/(.*)\\.js$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  transform: {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: { parser: { syntax: 'typescript' }, target: 'es2022' },
        module: { type: 'es6' },
      },
    ],
  },
  testMatch: ['<rootDir>/src/__tests__/**/*.test.js'],
  globalSetup: '<rootDir>/src/__tests__/helpers/db.js',
  globalTeardown: '<rootDir>/src/__tests__/helpers/db.teardown.js',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testTimeout: 30000,
  maxWorkers: 1,
  collectCoverageFrom: [
    'src/modules/**/*.ts',
    'src/middlewares/**/*.ts',
    '!src/modules/**/index.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
};
