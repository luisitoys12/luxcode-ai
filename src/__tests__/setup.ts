import { vi } from 'vitest';

// Mock global de vscode para todos los tests
vi.mock('vscode', () => ({
  window: {
    showErrorMessage:     vi.fn(),
    showInformationMessage: vi.fn(),
    showWarningMessage:   vi.fn(),
    showInputBox:         vi.fn(),
    showQuickPick:        vi.fn(),
    createWebviewPanel:   vi.fn(),
    activeTextEditor:     undefined,
    registerWebviewViewProvider: vi.fn(),
    withProgress:         vi.fn(async (_opts: any, fn: any) => fn({ report: vi.fn() })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((key: string, defaultVal: any) => defaultVal),
      update: vi.fn(),
    })),
    openTextDocument: vi.fn(),
  },
  commands: {
    registerCommand:  vi.fn(),
    executeCommand:   vi.fn(),
  },
  extensions: {
    getExtension: vi.fn(),
  },
  ExtensionContext: vi.fn(),
  Uri: {
    file:   vi.fn((p: string) => ({ fsPath: p, toString: () => p })),
    parse:  vi.fn((p: string) => ({ fsPath: p, toString: () => p })),
    joinPath: vi.fn((...args: any[]) => ({ toString: () => args.join('/') })),
  },
  ViewColumn: { One: 1, Two: 2, Beside: -2 },
  ProgressLocation: { Notification: 15, Window: 10 },
  ThemeIcon: vi.fn(),
  TreeItem: vi.fn(),
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  EventEmitter: vi.fn(() => ({
    event: vi.fn(),
    fire:  vi.fn(),
    dispose: vi.fn(),
  })),
  Disposable: { from: vi.fn() },
}));

// Mock global de fetch
global.fetch = vi.fn();

// Limpiar mocks entre tests
beforeEach(() => {
  vi.clearAllMocks();
});
