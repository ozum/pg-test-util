const baseConfig = require("./config/jest.config");

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...baseConfig,
  coverageThreshold: { global: { branches: 0, functions: 0, lines: 0, statements: 0 } },
};
