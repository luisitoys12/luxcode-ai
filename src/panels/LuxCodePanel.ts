import * as vscode from 'vscode';

export class LuxCodePanel {
  public static currentPanel: LuxCodePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;
    if (LuxCodePanel.currentPanel) { LuxCodePanel.currentPanel._panel.reveal(column); return; }
    const panel = vscode.window.createWebviewPanel('luxcodePanel', '⚡ LuxCode AI', column, { enableScripts: true, retainContextWhenHidden: true });
    LuxCodePanel.currentPanel = new LuxCodePanel(panel, extensionUri, context);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._panel.webview.html = LuxCodePanel.getWebviewContent(panel.webview, extensionUri);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.onDidReceiveMessage(async (msg) => {
      const { handleMessage } = await import('../extension');
      // re-route to shared handler
      vscode.commands.executeCommand(`luxcode.${msg.command === 'generateWeb' ? 'generateWeb' : msg.command === 'generateMobile' ? 'generateMobile' : 'generateDesktop'}`);
    }, null, this._disposables);
  }

  public static getWebviewContent(_webview: vscode.Webview, _extensionUri: vscode.Uri): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LuxCode AI</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--vscode-font-family);background:var(--vscode-sideBar-background);color:var(--vscode-foreground);padding:14px;font-size:13px}
h1{font-size:16px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:2px}
.sub{font-size:10px;opacity:.5;margin-bottom:16px}
label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;opacity:.7;margin-bottom:5px;margin-top:12px}
select,input{width:100%;padding:7px 9px;border-radius:6px;border:1px solid var(--vscode-input-border);background:var(--vscode-input-background);color:var(--vscode-input-foreground);font-size:12px}
.badge{display:inline-block;background:#7c3aed22;color:#a78bfa;border:1px solid #7c3aed44;border-radius:20px;padding:1px 7px;font-size:9px;font-weight:700;margin-left:5px}
.section{margin-top:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.btn{width:100%;padding:9px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:opacity .2s}
.btn:hover{opacity:.8}
.btn-web{background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff}
.btn-mobile{background:linear-gradient(135deg,#059669,#0891b2);color:#fff}
.btn-desktop{background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff}
.btn-save{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground);margin-top:6px}
.divider{border:none;border-top:1px solid #ffffff10;margin:14px 0}
.tip{font-size:9px;opacity:.4;margin-top:4px;line-height:1.5}
.provider-note{font-size:10px;opacity:.55;margin-top:6px;padding:6px 8px;border-radius:5px;background:#ffffff07}
</style>
</head>
<body>
<h1>⚡ LuxCode AI</h1>
<p class="sub">El mejor generador de apps con IA <span class="badge">v0.2.0</span></p>

<div class="section">
  <label>🔌 Proveedor de IA</label>
  <select id="provider" onchange="updateProviderNote()">
    <option value="gemini">🟢 Google Gemini 2.0 Flash — Gratis</option>
    <option value="groq">⚡ Groq (Llama 3.3 70B) — Gratis</option>
    <option value="ollama">🦙 Ollama — Local / Sin internet</option>
    <option value="lmstudio">🖥 LM Studio — Local / Sin internet</option>
    <option value="openai">🟣 OpenAI GPT-4o</option>
    <option value="openrouter">🌐 OpenRouter (100+ modelos)</option>
  </select>
  <div class="provider-note" id="providerNote">Obtén tu key gratis en aistudio.google.com</div>
</div>

<div class="section" id="keySection">
  <label>🔑 API Key</label>
  <input type="password" id="apiKey" placeholder="Pega tu API Key aquí..." />
</div>

<div class="section" id="ollamaSection" style="display:none">
  <label>🦙 Modelo Ollama</label>
  <select id="ollamaModel">
    <option value="llama3">Llama 3 (recomendado)</option>
    <option value="mistral">Mistral 7B</option>
    <option value="codellama">CodeLlama</option>
    <option value="deepseek-coder">DeepSeek Coder</option>
    <option value="phi3">Phi-3 Mini (ligero)</option>
    <option value="gemma2">Gemma 2</option>
  </select>
</div>

<button class="btn btn-save" onclick="saveConfig()">💾 Guardar configuración</button>

<hr class="divider">

<div class="section">
  <label>🚀 Generar con IA</label>
  <div class="grid">
    <button class="btn btn-web" onclick="gen('generateWeb')">🌐 Web</button>
    <button class="btn btn-mobile" onclick="gen('generateMobile')">📱 Móvil</button>
  </div>
  <div style="margin-top:8px">
    <button class="btn btn-desktop" onclick="gen('generateDesktop')">🖥 App Escritorio</button>
  </div>
</div>

<hr class="divider">

<p style="font-size:10px;opacity:.4;text-align:center">LuxCode AI · Open Source · MIT</p>

<script>
const vscode = acquireVsCodeApi();
const notes = {
  gemini: 'Gratis en aistudio.google.com/app/apikey',
  groq: 'Gratis en console.groq.com — ultra rápido',
  ollama: 'Sin internet. Instala Ollama y corre: ollama pull llama3',
  lmstudio: 'Sin internet. Descarga LM Studio y carga un modelo',
  openai: 'De pago en platform.openai.com/api-keys',
  openrouter: 'Gratis/pago en openrouter.ai — acceso a 100+ modelos'
};
function updateProviderNote() {
  const p = document.getElementById('provider').value;
  document.getElementById('providerNote').textContent = notes[p] || '';
  const isLocal = ['ollama','lmstudio'].includes(p);
  document.getElementById('keySection').style.display = isLocal ? 'none' : 'block';
  document.getElementById('ollamaSection').style.display = p === 'ollama' ? 'block' : 'none';
}
function saveConfig() {
  const provider = document.getElementById('provider').value;
  const key = document.getElementById('apiKey').value.trim();
  const ollamaModel = document.getElementById('ollamaModel').value;
  vscode.postMessage({ command: 'saveConfig', provider, key, ollamaModel });
}
function gen(cmd) {
  vscode.postMessage({ command: cmd });
}
updateProviderNote();
</script>
</body>
</html>`;
  }

  public dispose() {
    LuxCodePanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) { const d = this._disposables.pop(); if (d) d.dispose(); }
  }
}
