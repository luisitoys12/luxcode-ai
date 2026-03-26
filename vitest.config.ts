import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
    alias: {
      // Mock completo del módulo vscode — nunca intenta importar el real
      vscode: new URL('./src/__mocks__/vscode.ts', import.meta.url).pathname,
    },
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
        statements: 60,
        branches:   50,
        functions:  60,
        lines:      60,
      },
    },
  },
});
