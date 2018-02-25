module.exports = {
  transform: {
    "^.+\\.(j|t)sx?$": "ts-jest"
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  mapCoverage: true,
  globals: {
    "ts-jest": {
      tsConfigFile: "tsconfig.test.json"
    }
  },
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
