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

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, _context: vscode.ExtensionContext) {
    this._panel = panel;
    this._panel.webview.html = LuxCodePanel.getWebviewContent(panel.webview, extensionUri);
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
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
body{font-family:var(--vscode-font-family);background:var(--vscode-sideBar-background);color:var(--vscode-foreground);padding:14px;font-size:13px;min-height:100vh}
h1{font-size:15px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:2px}
.sub{font-size:10px;opacity:.45;margin-bottom:16px}
label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;opacity:.6;margin:12px 0 5px}
select,input{width:100%;padding:7px 9px;border-radius:6px;border:1px solid var(--vscode-input-border);background:var(--vscode-input-background);color:var(--vscode-input-foreground);font-size:12px}
.btn{width:100%;padding:8px;border-radius:7px;border:none;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;margin-top:6px;display:flex;align-items:center;justify-content:center;gap:6px}
.btn:hover{filter:brightness(1.15);transform:translateY(-1px)}
.btn-web{background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff}
.btn-mobile{background:linear-gradient(135deg,#059669,#0891b2);color:#fff}
.btn-desktop{background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff}
.btn-api{background:linear-gradient(135deg,#d97706,#ca8a04);color:#fff}
.btn-agent{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-size:13px;padding:10px}
.btn-mcp{background:#ffffff08;color:var(--vscode-foreground);border:1px solid #ffffff15}
.btn-save{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}
.divider{border:none;border-top:1px solid #ffffff0d;margin:14px 0}
.note{font-size:9px;opacity:.4;margin-top:4px;line-height:1.5}
.provider-note{font-size:10px;color:#a78bfa;margin-top:5px;padding:5px 8px;border-radius:5px;background:#7c3aed10}
.badge-new{background:#7c3aed;color:#fff;font-size:8px;padding:1px 5px;border-radius:4px;vertical-align:middle;margin-left:4px}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;opacity:.5;margin:14px 0 6px;letter-spacing:1px}
</style>
</head>
<body>
<h1>⚡ LuxCode AI</h1>
<p class="sub">Generador IA · Web · Mobile · Desktop · API <span style="color:#a78bfa;font-size:9px">v0.3.0</span></p>

<label>🔌 Proveedor de IA</label>
<select id="provider" onchange="updateNote()">
  <option value="gemini">🟢 Gemini 2.0 Flash — Gratis</option>
  <option value="groq">⚡ Groq Llama 3.3 70B — Gratis</option>
  <option value="ollama">🦙 Ollama — Local sin internet</option>
  <option value="lmstudio">🖥 LM Studio — Local sin internet</option>
  <option value="openrouter">🌐 OpenRouter — 100+ modelos</option>
  <option value="openai">🟣 OpenAI GPT-4o</option>
</select>
<div class="provider-note" id="pNote">Gratis: aistudio.google.com/app/apikey</div>

<div id="keyBox">
  <label>🔑 API Key</label>
  <input type="password" id="apiKey" placeholder="Pega tu API Key..." />
</div>
<div id="ollamaBox" style="display:none">
  <label>Modelo Ollama</label>
  <select id="ollamaModel">
    <option value="llama3">Llama 3</option>
    <option value="codellama">CodeLlama</option>
    <option value="deepseek-coder">DeepSeek Coder</option>
    <option value="mistral">Mistral 7B</option>
    <option value="phi3">Phi-3 Mini</option>
    <option value="gemma2">Gemma 2</option>
    <option value="qwen2.5-coder">Qwen 2.5 Coder</option>
  </select>
</div>
<button class="btn btn-save" onclick="saveConfig()">💾 Guardar configuración</button>

<hr class="divider">

<p class="section-title">🚀 Generar proyecto</p>
<div class="grid2">
  <button class="btn btn-web" onclick="cmd('generateWeb')">🌐 Web</button>
  <button class="btn btn-mobile" onclick="cmd('generateMobile')">📱 Móvil</button>
</div>
<div class="grid2" style="margin-top:6px">
  <button class="btn btn-desktop" onclick="cmd('generateDesktop')">🖥 Desktop</button>
  <button class="btn btn-api" onclick="cmd('generateAPI')">🔌 API REST</button>
</div>

<hr class="divider">

<p class="section-title">🤖 Modo Agente <span class="badge-new">NUEVO</span></p>
<button class="btn btn-agent" onclick="cmd('agentTask')">🤖 Ejecutar tarea compleja con Agente</button>
<p class="note">El agente planifica y ejecuta múltiples pasos automáticamente para proyectos complejos</p>

<hr class="divider">

<p class="section-title">🔌 MCP Servers <span class="badge-new">NUEVO</span></p>
<button class="btn btn-mcp" onclick="cmd('mcpConnect')">+ Conectar servidor MCP</button>
<p class="note">Compatible con Kilo.ai, Cline, GitHub Copilot Agent, Claude. Conecta herramientas externas al flujo de generación.</p>

<hr class="divider">
<p style="font-size:9px;opacity:.3;text-align:center">LuxCode AI · Open Source MIT · luisitoys12</p>

<script>
const vscode = acquireVsCodeApi();
const notes = {
  gemini:'Gratis en aistudio.google.com/app/apikey',
  groq:'Gratis en console.groq.com — ultra rápido',
  ollama:'Sin internet. Instala Ollama: ollama pull llama3',
  lmstudio:'Sin internet. Descarga LM Studio + carga modelo',
  openai:'De pago en platform.openai.com/api-keys',
  openrouter:'Gratis/pago en openrouter.ai — 100+ modelos'
};
function updateNote(){
  const p=document.getElementById('provider').value;
  document.getElementById('pNote').textContent=notes[p]||'';
  const local=['ollama','lmstudio'].includes(p);
  document.getElementById('keyBox').style.display=local?'none':'block';
  document.getElementById('ollamaBox').style.display=p==='ollama'?'block':'none';
}
function saveConfig(){
  const provider=document.getElementById('provider').value;
  const key=document.getElementById('apiKey').value.trim();
  const ollamaModel=document.getElementById('ollamaModel').value;
  vscode.postMessage({command:'saveConfig',provider,key,ollamaModel});
}
function cmd(c){vscode.postMessage({command:c});}
updateNote();
</script>
</body>
</html>`;
  }

  public dispose(){
    LuxCodePanel.currentPanel=undefined;
    this._panel.dispose();
    while(this._disposables.length){const d=this._disposables.pop();if(d)d.dispose();}
  }
}
