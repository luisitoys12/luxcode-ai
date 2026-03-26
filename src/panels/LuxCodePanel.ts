import * as vscode from 'vscode';

export class LuxCodePanel {
  public static currentPanel: LuxCodePanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;
    if (LuxCodePanel.currentPanel) { LuxCodePanel.currentPanel._panel.reveal(column); return; }
    const panel = vscode.window.createWebviewPanel('luxcodePanel', '\u26a1 LuxCode AI', column, { enableScripts: true, retainContextWhenHidden: true });
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
/* === Reset === */
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--vscode-font-family);background:var(--vscode-sideBar-background);color:var(--vscode-foreground);padding:14px;font-size:13px;min-height:100vh}

/* === Tipografia === */
h1{font-size:15px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#60a5fa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:2px}
.sub{font-size:10px;opacity:.45;margin-bottom:16px}

/* === Labels siempre visibles (no solo placeholder) === */
label{display:block;font-size:10px;font-weight:700;text-transform:uppercase;opacity:.6;margin:12px 0 5px;cursor:pointer}

/* === Inputs dentro de form para submit con Enter === */
select,input[type="password"],input[type="text"]{
  width:100%;padding:7px 9px;border-radius:6px;
  border:1px solid var(--vscode-input-border);
  background:var(--vscode-input-background);
  color:var(--vscode-input-foreground);
  font-size:12px;
  /* a11y: focus visible obligatorio */
  outline:none;
}
select:focus,input:focus{
  outline:2px solid #7c3aed;
  outline-offset:1px;
}

/* === Botones === */
.btn{
  width:100%;padding:8px;
  border-radius:7px;border:none;
  font-size:12px;font-weight:700;
  cursor:pointer;
  /* Animacion con transform+opacity, no solo opacity */
  transition:filter .2s, transform .2s, opacity .2s;
  margin-top:6px;
  display:flex;align-items:center;justify-content:center;gap:6px;
  /* Evitar seleccion de texto en botones */
  user-select:none;
  -webkit-user-select:none;
  position:relative;
  overflow:hidden;
}
.btn:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}
/* Disabled tras submit para evitar doble request */
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none;filter:none}
/* Focus visible en teclado */
.btn:focus-visible{outline:2px solid #a78bfa;outline-offset:2px}

.btn-web{background:linear-gradient(135deg,#7c3aed,#3b82f6);color:#fff}
.btn-mobile{background:linear-gradient(135deg,#059669,#0891b2);color:#fff}
.btn-desktop{background:linear-gradient(135deg,#dc2626,#ea580c);color:#fff}
.btn-api{background:linear-gradient(135deg,#d97706,#ca8a04);color:#fff}
.btn-agent{background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;font-size:13px;padding:10px}
.btn-mcp{background:#ffffff08;color:var(--vscode-foreground);border:1px solid #ffffff15}
.btn-save{background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}

/* Skeleton loader para estado de carga */
.skeleton{
  background:linear-gradient(90deg,#ffffff08 25%,#ffffff18 50%,#ffffff08 75%);
  background-size:200% 100%;
  border-radius:6px;
  height:32px;
  width:100%;
  margin-top:6px;
}
/* Respetar prefers-reduced-motion */
@media (prefers-reduced-motion: no-preference){
  .skeleton{animation:skeleton-shimmer 1.5s infinite;}
  .btn:hover:not(:disabled){transform:translateY(-1px)}
  .btn{transition:filter .2s, transform .2s, opacity .2s;}
}
@media (prefers-reduced-motion: reduce){
  .btn{transition:opacity .1s;}
  .skeleton{animation:none;}
}
@keyframes skeleton-shimmer{
  0%{background-position:200% 0}
  100%{background-position:-200% 0}
}

.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}
.divider{border:none;border-top:1px solid #ffffff0d;margin:14px 0}
.note{font-size:9px;opacity:.4;margin-top:4px;line-height:1.5}
.provider-note{font-size:10px;color:#a78bfa;margin-top:5px;padding:5px 8px;border-radius:5px;background:#7c3aed10}
.badge-new{background:#7c3aed;color:#fff;font-size:8px;padding:1px 5px;border-radius:4px;vertical-align:middle;margin-left:4px}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;opacity:.5;margin:14px 0 6px;letter-spacing:1px}

/* Seleccion de texto con color de marca */
::selection{background:#7c3aed55;color:#fff}
</style>
</head>

<!-- Semantic landmark -->
<body>
<header>
  <h1>\u26a1 LuxCode AI</h1>
  <p class="sub">Generador IA \u00b7 Web \u00b7 Mobile \u00b7 Desktop \u00b7 API <span style="color:#a78bfa;font-size:9px">v0.3.0</span></p>
</header>

<main>
  <!-- === CONFIG FORM (inputs dentro de form para submit con Enter) === -->
  <form id="configForm" onsubmit="saveConfig(event)" aria-label="Configuraci\u00f3n del proveedor de IA" novalidate>

    <label for="provider">\ud83d\udd0c Proveedor de IA</label>
    <select id="provider" name="provider" onchange="updateNote()" aria-label="Seleccionar proveedor de IA">
      <option value="gemini">\ud83d\udfe2 Gemini 2.0 Flash \u2014 Gratis</option>
      <option value="groq">\u26a1 Groq Llama 3.3 70B \u2014 Gratis</option>
      <option value="ollama">\ud83e\udd99 Ollama \u2014 Local sin internet</option>
      <option value="lmstudio">\ud83d\udda5 LM Studio \u2014 Local sin internet</option>
      <option value="openrouter">\ud83c\udf10 OpenRouter \u2014 100+ modelos</option>
      <option value="openai">\ud83d\udfe3 OpenAI GPT-4o</option>
    </select>
    <!-- Feedback relativo al trigger: nota debajo del select, no global -->
    <div class="provider-note" id="pNote" role="status" aria-live="polite">Gratis: aistudio.google.com/app/apikey</div>

    <div id="keyBox">
      <label for="apiKey">\ud83d� API Key</label>
      <input
        type="password"
        id="apiKey"
        name="apiKey"
        placeholder="Pega tu API Key..."
        autocomplete="off"
        spellcheck="false"
        aria-label="API Key del proveedor de IA seleccionado"
      />
    </div>

    <div id="ollamaBox" style="display:none">
      <label for="ollamaModel">Modelo Ollama</label>
      <select id="ollamaModel" name="ollamaModel" aria-label="Modelo de Ollama">
        <option value="llama3">Llama 3</option>
        <option value="codellama">CodeLlama</option>
        <option value="deepseek-coder">DeepSeek Coder</option>
        <option value="mistral">Mistral 7B</option>
        <option value="phi3">Phi-3 Mini</option>
        <option value="gemma2">Gemma 2</option>
        <option value="qwen2.5-coder">Qwen 2.5 Coder</option>
      </select>
    </div>

    <!-- Boton submit dentro del form (Enter funciona) -->
    <button type="submit" class="btn btn-save" aria-label="Guardar configuraci\u00f3n del proveedor">\ud83d� Guardar configuraci\u00f3n</button>

  </form>

  <hr class="divider">

  <!-- === GENERADORES === -->
  <section aria-label="Generar proyecto">
    <p class="section-title">\ud83d� Generar proyecto</p>
    <div class="grid2">
      <button class="btn btn-web" onclick="cmd('generateWeb', this)" aria-label="Generar p\u00e1gina web con IA">\ud83c\udf10 Web</button>
      <button class="btn btn-mobile" onclick="cmd('generateMobile', this)" aria-label="Generar app m\u00f3vil con IA">\ud83d� M\u00f3vil</button>
    </div>
    <div class="grid2" style="margin-top:6px">
      <button class="btn btn-desktop" onclick="cmd('generateDesktop', this)" aria-label="Generar app de escritorio con IA">\ud83d� Desktop</button>
      <button class="btn btn-api" onclick="cmd('generateAPI', this)" aria-label="Generar API REST con IA">\ud83d� API REST</button>
    </div>
  </section>

  <hr class="divider">

  <!-- === AGENTE === -->
  <section aria-label="Modo Agente">
    <p class="section-title">\ud83e� Modo Agente <span class="badge-new" aria-label="Nuevo">NUEVO</span></p>
    <button class="btn btn-agent" onclick="cmd('agentTask', this)" aria-label="Ejecutar tarea compleja con el agente IA">\ud83e� Ejecutar tarea compleja con Agente</button>
    <p class="note" role="note">El agente planifica y ejecuta m\u00faltiples pasos autom\u00e1ticamente para proyectos complejos</p>
  </section>

  <hr class="divider">

  <!-- === MCP === -->
  <section aria-label="MCP Servers">
    <p class="section-title">\ud83d� MCP Servers <span class="badge-new" aria-label="Nuevo">NUEVO</span></p>
    <button class="btn btn-mcp" onclick="cmd('mcpConnect', this)" aria-label="Conectar un servidor MCP externo">+ Conectar servidor MCP</button>
    <p class="note" role="note">Compatible con Kilo.ai, Cline, GitHub Copilot Agent, Claude. Conecta herramientas externas al flujo de generaci\u00f3n.</p>
  </section>

</main>

<footer>
  <hr class="divider">
  <p style="font-size:9px;opacity:.3;text-align:center">LuxCode AI \u00b7 Open Source MIT \u00b7 luisitoys12</p>
</footer>

<script>
const vscode = acquireVsCodeApi();
const notes = {
  gemini:'Gratis en aistudio.google.com/app/apikey',
  groq:'Gratis en console.groq.com \u2014 ultra r\u00e1pido',
  ollama:'Sin internet. Instala Ollama: ollama pull llama3',
  lmstudio:'Sin internet. Descarga LM Studio + carga modelo',
  openai:'De pago en platform.openai.com/api-keys',
  openrouter:'Gratis/pago en openrouter.ai \u2014 100+ modelos'
};

function updateNote(){
  const p = document.getElementById('provider').value;
  const noteEl = document.getElementById('pNote');
  // Actualizar optimisticamente (inline, relativo al trigger)
  noteEl.textContent = notes[p] || '';
  const local = ['ollama','lmstudio'].includes(p);
  document.getElementById('keyBox').style.display = local ? 'none' : 'block';
  document.getElementById('ollamaBox').style.display = p === 'ollama' ? 'block' : 'none';
}

function saveConfig(event) {
  if (event) event.preventDefault();
  const btn = document.querySelector('[type="submit"]');
  const provider = document.getElementById('provider').value;
  const key = document.getElementById('apiKey').value.trim();
  const ollamaModel = document.getElementById('ollamaModel').value;

  // Deshabilitar boton tras submit (evitar doble request)
  btn.disabled = true;
  const original = btn.textContent;
  btn.textContent = '\u2705 Guardado';

  vscode.postMessage({command:'saveConfig', provider, key, ollamaModel});

  // Revertir tras 2s (feedback optimista)
  setTimeout(() => {
    btn.disabled = false;
    btn.textContent = original;
  }, 2000);
}

function cmd(c, btn) {
  if (!btn) return vscode.postMessage({command: c});
  // Deshabilitar boton mientras la IA trabaja
  btn.disabled = true;
  const original = btn.innerHTML;
  btn.innerHTML = '<span class="skeleton" style="width:80px;height:14px;display:inline-block"></span>';
  vscode.postMessage({command: c});
  // Re-habilitar tras 8s (timeout de seguridad)
  setTimeout(() => {
    btn.disabled = false;
    btn.innerHTML = original;
  }, 8000);
}

updateNote();
</script>
</body>
</html>`;
  }

  public dispose(){
    LuxCodePanel.currentPanel = undefined;
    this._panel.dispose();
    while(this._disposables.length){const d = this._disposables.pop(); if(d) d.dispose();}
  }
}
