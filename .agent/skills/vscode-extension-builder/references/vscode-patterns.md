# VS Code Extension — Patrones de referencia

Archivo de referencia para el skill `vscode-extension-builder`.
Contiene snippets completos listos para copiar.

## extension.ts — plantilla mínima

```typescript
import * as vscode from 'vscode';
import { MyPanel } from './panels/MyPanel';
import { myCommand } from './commands/myCommand';

export function activate(context: vscode.ExtensionContext) {
  // Registrar todos los comandos como disposables
  context.subscriptions.push(
    vscode.commands.registerCommand('myExt.openPanel', () =>
      MyPanel.createOrShow(context.extensionUri, context)
    ),
    vscode.commands.registerCommand('myExt.myCommand', () =>
      myCommand(context)
    )
  );
}

export function deactivate() {}
```

## Panel WebView — plantilla completa

```typescript
import * as vscode from 'vscode';

function getNonce(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 32 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
}

export class MyPanel {
  public static currentPanel: MyPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (MyPanel.currentPanel) {
      MyPanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'myPanel',
      'My Extension',
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    MyPanel.currentPanel = new MyPanel(panel, extensionUri, context);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    _context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._panel.webview.html = MyPanel._getHtml(panel.webview);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Manejar mensajes del WebView
    this._panel.webview.onDidReceiveMessage(
      async (msg) => {
        switch (msg.command) {
          case 'saveConfig':
            // Usar Secrets API para keys
            await _context.secrets.store('apiKey', msg.key);
            break;
        }
      },
      null,
      this._disposables
    );
  }

  private static _getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const csp = [
      `default-src 'none'`,
      `style-src 'unsafe-inline' ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
      `connect-src https://api.example.com`,  // solo dominios necesarios
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My Extension</title>
  <style>
    :root {
      --ext-primary: #7c3aed;
      --ext-radius: 6px;
    }
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-sideBar-background);
      color: var(--vscode-foreground);
      padding: 16px;
    }
    button:focus-visible { outline: 2px solid var(--ext-primary); outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  </style>
</head>
<body>
  <h1>My Extension</h1>
  <div id="status" role="status" aria-live="polite"></div>
  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    // comunicación bidireccional
    vscode.postMessage({ command: 'ready' });
  </script>
</body>
</html>`;
  }

  public dispose() {
    MyPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
```

## vitest.config.ts — configuración estándar

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/services/**', 'src/panels/**', 'src/commands/**'],
      exclude: ['src/__tests__/**', 'src/__fixtures__/**'],
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
    },
    setupFiles: ['src/__tests__/setup.ts'],
  },
});
```

## tsconfig.json — configuración estándar

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", ".vscode-test", "src/__tests__"]
}
```

## Secrets API — almacenar API keys de forma segura

```typescript
// CORRECTO: Secrets API (cifrado por VS Code)
await context.secrets.store('myExt.apiKey', apiKey);
const key = await context.secrets.get('myExt.apiKey') ?? '';

// INCORRECTO: globalState (no cifrado)
context.globalState.update('apiKey', apiKey);  // ❌ nunca
```

## CI — workflow ci.yml base

```yaml
name: ⚙️ CI — Build, Test & Coverage
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run compile
      - run: npx @vscode/vsce package --no-dependencies
      - uses: actions/upload-artifact@v4
        with: { name: extension-vsix, path: '*.vsix', retention-days: 7 }
```
