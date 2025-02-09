const nextJest = require("next/jest.js");

const createJestConfig = nextJest({
  dir: "./",
});

const config = {
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageProvider: "v8",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testEnvironment: "jsdom",
};

module.exports = createJestConfig(config);
