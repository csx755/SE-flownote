import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    env: {
      JWT_SECRET: 'vitest-jwt-secret-key-for-testing-only',
      DATABASE_URL: 'postgresql://flownote:flownote@localhost:5432/flownote',
      PORT: '3000',
    },
  },
});
