import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases live in tsconfig.json, so they are read from there
// instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile('./tsconfig.json', ts.sys.readFile);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
    // Resolve the shared package to source so tests never run against a
    // stale dist build.
    '^@acme/shared$': '<rootDir>/../../packages/shared/src/index.ts',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'prisma/seed/salary-model.ts',
    '!src/main.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  testTimeout: 15_000,
};

export default config;