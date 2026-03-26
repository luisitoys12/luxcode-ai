import { vi } from 'vitest';

// Mock global de vscode — no disponible en entorno de test Node
vi.mock('vscode', () => ({
  window: {
    activeTextEditor: undefined,
    createWebviewPanel: vi.fn(),
    showInputBox: vi.fn(),
    showErrorMessage: vi.fn(),
    showInformationMessage: vi.fn(),
  },
  ViewColumn: { One: 1, Beside: 2 },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, def: unknown) => def),
    })),
  },
  Uri: { joinPath: vi.fn() },
}));

// Mock global de fetch
global.fetch = vi.fn();
