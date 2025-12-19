// ABOUTME: Vitest configuration for test runner
// ABOUTME: Configures TypeScript support and test file patterns

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts', 'src/**/*.test.ts'],
    globals: true,
  },
});
