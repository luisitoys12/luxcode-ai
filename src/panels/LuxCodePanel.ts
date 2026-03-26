import * as vscode from 'vscode';

export class LuxCodePanel {
  public static currentPanel: LuxCodePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : vscode.ViewColumn.One;

    if (LuxCodePanel.currentPanel) {
      LuxCodePanel.currentPanel._panel.reveal(column);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'luxcodePanel',
      '🤖 LuxCode AI',
      column,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    LuxCodePanel.currentPanel = new LuxCodePanel(panel, extensionUri, context);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext
  ) {
    this._panel = panel;
    this._panel.webview.html = LuxCodePanel.getWebviewContent(panel.webview, extensionUri);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    this._panel.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'generate':
          await vscode.commands.executeCommand('luxcode.generatePage');
          break;
        case 'edit':
          await vscode.commands.executeCommand('luxcode.editWithAI');
          break;
        case 'saveKey':
          const config = vscode.workspace.getConfiguration('luxcode');
          const keyProp = message.provider === 'gemini' ? 'geminiApiKey' : 'openaiApiKey';
          await config.update(keyProp, message.key, vscode.ConfigurationTarget.Global);
          await config.update('apiProvider', message.provider, vscode.ConfigurationTarget.Global);
          panel.webview.postMessage({ command: 'keySaved' });
          vscode.window.showInformationMessage(`✅ API Key de ${message.provider === 'gemini' ? 'Gemini' : 'OpenAI'} guardada`);
          break;
      }
    }, null, this._disposables);
  }

  public static getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LuxCode AI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      background: var(--vscode-sideBar-background);
      color: var(--vscode-foreground);
      padding: 16px;
    }
    h1 {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .subtitle { font-size: 11px; opacity: 0.6; margin-bottom: 20px; }
    .section { margin-bottom: 20px; }
    label { display: block; font-size: 11px; font-weight: 600; margin-bottom: 6px; opacity: 0.8; text-transform: uppercase; }
    select, input, textarea {
      width: 100%;
      padding: 8px 10px;
      border-radius: 6px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-size: 12px;
      font-family: inherit;
    }
    textarea { resize: vertical; min-height: 80px; }
    .btn {
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
      margin-top: 8px;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: linear-gradient(135deg, #7c3aed, #3b82f6); color: white; }
    .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .badge {
      display: inline-block;
      background: #7c3aed22;
      color: #a78bfa;
      border: 1px solid #7c3aed44;
      border-radius: 20px;
      padding: 2px 8px;
      font-size: 10px;
      font-weight: 600;
      margin-left: 6px;
    }
    .status {
      font-size: 11px;
      padding: 6px 10px;
      border-radius: 6px;
      margin-top: 8px;
      display: none;
    }
    .status.success { background: #16a34a22; color: #4ade80; border: 1px solid #16a34a44; display: block; }
    .divider { border: none; border-top: 1px solid var(--vscode-widget-border, #ffffff15); margin: 16px 0; }
    .tip { font-size: 10px; opacity: 0.5; margin-top: 6px; }
  </style>
</head>
<body>
  <h1>⚡ LuxCode AI</h1>
  <p class="subtitle">Crea páginas web con IA <span class="badge">BETA</span></p>

  <div class="section">
    <label>🔑 Proveedor de IA</label>
    <select id="provider">
      <option value="gemini">Google Gemini 2.0 Flash (Gratis)</option>
      <option value="openai">OpenAI GPT-4o</option>
    </select>
  </div>

  <div class="section">
    <label>API Key</label>
    <input type="password" id="apiKey" placeholder="Pega tu API Key aquí..." />
    <button class="btn btn-secondary" onclick="saveKey()" style="margin-top:6px">💾 Guardar Key</button>
    <div class="status" id="keyStatus">✅ API Key guardada correctamente</div>
    <p class="tip">Tu key se guarda localmente en VS Code settings. Nunca se envía a servidores de LuxCode.</p>
  </div>

  <hr class="divider">

  <div class="section">
    <label>🌐 Generar Página Web</label>
    <textarea id="pageDesc" placeholder="Describe la página que quieres crear...&#10;&#10;Ej: Landing page para una radio de música electrónica con hero animado, reproductor de audio y sección de contacto"></textarea>
    <button class="btn btn-primary" onclick="generatePage()">🚀 Generar con IA</button>
  </div>

  <hr class="divider">

  <div class="section">
    <label>✏️ Editar código seleccionado</label>
    <p style="font-size:11px; opacity:0.6; margin-bottom:8px">Selecciona código en el editor, luego haz clic:</p>
    <button class="btn btn-secondary" onclick="editCode()">✨ Mejorar con IA</button>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    function saveKey() {
      const key = document.getElementById('apiKey').value.trim();
      const provider = document.getElementById('provider').value;
      if (!key) { alert('Ingresa tu API Key primero'); return; }
      vscode.postMessage({ command: 'saveKey', key, provider });
    }

    function generatePage() {
      vscode.postMessage({ command: 'generate' });
    }

    function editCode() {
      vscode.postMessage({ command: 'edit' });
    }

    window.addEventListener('message', (event) => {
      if (event.data.command === 'keySaved') {
        document.getElementById('keyStatus').classList.add('success');
        setTimeout(() => document.getElementById('keyStatus').classList.remove('success'), 3000);
      }
    });
  </script>
</body>
</html>`;
  }

  public dispose() {
    LuxCodePanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
