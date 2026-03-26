import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'src/services/**',
        'src/panels/**',
        'src/commands/**',
      ],
      exclude: [
        'src/__tests__/**',
        'src/__fixtures__/**',
        'src/__mocks__/**',
      ],
      thresholds: {
        statements: 80,
        branches:   70,
        functions:  80,
        lines:      80,
      },
    },
  },
});
