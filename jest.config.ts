import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterFramework: ["<rootDir>/src/__tests__/setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/__tests__/**",
  ],
  testMatch: ["<rootDir>/src/__tests__/**/*.test.{ts,tsx}"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
} as any);
