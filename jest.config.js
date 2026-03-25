module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/types.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 60000, // 60 seconds for performance tests
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES2020',
        lib: ['ES2020'],
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        downlevelIteration: true,
        strict: true,
        skipLibCheck: true
      }
    }
  }
};
