import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

export default createJestConfig({
  testEnvironment: 'jsdom',
  testRegex: '.*\\.spec\\.(ts|tsx)$',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@acme/shared$': '<rootDir>/../../packages/shared/src/index.ts',
    // packages/shared uses Node16 module resolution, which requires explicit
    // .js extensions on relative imports. Jest resolves straight to the .ts
    // source, so those extensions need stripping before it looks the file up.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
});