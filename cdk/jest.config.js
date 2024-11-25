module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/bin', '<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
