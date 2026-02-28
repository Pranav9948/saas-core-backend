/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    // 1. Handle aliased imports with .js extensions: @/dir/file.js -> <rootDir>/src/dir/file.ts
    '^@/(.*)\\.js$': '<rootDir>/src/$1',

    // 2. Handle aliased imports without extensions: @/dir/file -> <rootDir>/src/dir/file
    '^@/(.*)$': '<rootDir>/src/$1',

    // 3. Handle relative imports with .js extensions: ./file.js -> ./file
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
        diagnostics: { ignoreCodes: [151002] },
      },
    ],
  },
};
