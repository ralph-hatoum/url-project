module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.ts?$': 'ts-jest', // Transform TypeScript files
    },
    globals: {
      'ts-jest': {
        useESM: true, // Enable ES module support
      },
    },
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1', // Fix imports by removing .js extension
    },
  };