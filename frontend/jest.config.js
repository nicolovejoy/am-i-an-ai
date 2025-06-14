/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleNameMapper: {
    "^@/shared/(.*)$": "<rootDir>/../shared/$1",
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
  },
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        presets: [
          ["@babel/preset-env", { targets: { node: "current" } }],
          "@babel/preset-react",
          "@babel/preset-typescript",
        ],
      },
    ],
  },
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
  ],
  testTimeout: process.env.CI ? 15000 : 5000,
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
    "**/performance/**/*.[jt]s?(x)",
  ],
  // snapshotSerializers: ["@emotion/jest/serializer"],
  maxWorkers: process.env.CI ? 2 : "50%",
  cache: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = config;
