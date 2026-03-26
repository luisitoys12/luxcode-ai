// Mock estático de vscode para vitest — sin dependencia del runtime de VS Code
import { vi } from 'vitest';

const vscode = {
  window: {
    showErrorMessage:          vi.fn(),
    showInformationMessage:    vi.fn(),
    showWarningMessage:        vi.fn(),
    showInputBox:              vi.fn(),
    showQuickPick:             vi.fn(),
    createWebviewPanel:        vi.fn(),
    activeTextEditor:          undefined,
    registerWebviewViewProvider: vi.fn(),
    withProgress:              vi.fn(async (_opts: any, fn: any) => fn({ report: vi.fn() })),
  },
  workspace: {
    getConfiguration: vi.fn(() => ({
      get: vi.fn((_key: string, defaultVal: any) => defaultVal),
      update: vi.fn(),
    })),
    openTextDocument: vi.fn(),
    workspaceFolders: [{
      uri: { fsPath: '/tmp/test-workspace', toString: () => '/tmp/test-workspace' },
      name: 'test',
      index: 0,
    }],
    fs: {
      writeFile:       vi.fn().mockResolvedValue(undefined),
      createDirectory: vi.fn().mockResolvedValue(undefined),
      stat:            vi.fn().mockResolvedValue({ type: 1 }),
    },
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
    file:     vi.fn((p: string) => ({ fsPath: p, toString: () => p })),
    parse:    vi.fn((p: string) => ({ fsPath: p, toString: () => p })),
    joinPath: vi.fn((...args: any[]) => ({
      fsPath: args.map((a: any) => typeof a === 'string' ? a : a.fsPath).join('/'),
      toString: () => args.join('/')
    })),
  },
  ViewColumn: { One: 1, Two: 2, Beside: -2 },
  ProgressLocation: { Notification: 15, Window: 10 },
  ThemeIcon:  vi.fn(),
  TreeItem:   vi.fn(),
  TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
  EventEmitter: vi.fn(() => ({ event: vi.fn(), fire: vi.fn(), dispose: vi.fn() })),
  Disposable: { from: vi.fn() },
  SecretStorage: vi.fn(() => ({
    get:    vi.fn().mockResolvedValue(undefined),
    store:  vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  })),
};

export default vscode;
export const { window, workspace, commands, extensions, Uri, ViewColumn,
  ProgressLocation, ThemeIcon, TreeItem, TreeItemCollapsibleState,
  EventEmitter, Disposable, ExtensionContext, SecretStorage } = vscode;
