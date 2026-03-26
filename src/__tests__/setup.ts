import { vi, beforeEach } from 'vitest';

// vscode se resuelve via alias en vitest.config.ts → src/__mocks__/vscode.ts
// Este setup solo garantiza limpieza entre tests
global.fetch = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});
