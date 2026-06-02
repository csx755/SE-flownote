import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    env: {
      // auth.ts throws if missing — provide a known value for all test suites
      JWT_SECRET: 'vitest-jwt-secret-key-for-testing-only',
    },
  },
});
