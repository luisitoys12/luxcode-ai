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

  public static getWebviewContent(webview: vscode.Webview, _extensionUri: vscode.Uri): string {
    const nonce = getNonce();
    // [WV-01] CSP: nonce + dominios explícitos, sin 'unsafe-inline' en scripts
    const csp = [
      `default-src 'none'`,
      `style-src 'unsafe-inline' ${webview.cspSource}`,
      `script-src 'nonce-${nonce}'`,
      `connect-src https://generativelanguage.googleapis.com https://api.openai.com https://api.groq.com https://openrouter.ai`
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>LuxCode AI</title>
<style>
/* [FD-CO01 FIX] Tokens CSS — ya no hay colores hex hardcoded en componentes */
:root {
  --lux-primary:        #7c3aed;
  --lux-primary-hover:  #6d28d9;
  --lux-accent-blue:    #3b82f6;
  --lux-accent-green:   #059669;
  --lux-accent-cyan:    #0891b2;
  --lux-accent-red:     #dc2626;
  --lux-accent-orange:  #ea580c;
  --lux-accent-yellow:  #d97706;
  --lux-accent-pink:    #ec4899;
  --lux-surface:        #ffffff08;
  --lux-border:         #ffffff15;
  --lux-text-muted:     rgba(255,255,255,.45);
  --lux-text-note:      rgba(255,255,255,.4);
  --lux-purple-soft:    #a78bfa;
  --lux-glow-primary:   #7c3aed55;
  --lux-glow-soft:      #7c3aed10;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 7px;
  --transition-base: .2s;
}
/* [FD-LA05 FIX] Breakpoints explícitos mobile-first */
*{margin:0;padding:0;box-sizing:border-box}
body{
  font-family:var(--vscode-font-family);
  background:var(--vscode-sideBar-background);
  color:var(--vscode-foreground);
  padding:14px;
  font-size:13px;
  min-height:100vh;
}
h1{
  font-size:15px;font-weight:800;
  background:linear-gradient(135deg,var(--lux-purple-soft),var(--lux-accent-blue));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  margin-bottom:2px;
}
.sub{font-size:10px;opacity:.45;margin-bottom:16px}
label{
  display:block;font-size:10px;font-weight:700;
  text-transform:uppercase;opacity:.6;
  margin:12px 0 5px;cursor:pointer;
}
select,input[type="password"],input[type="text"]{
  width:100%;padding:7px 9px;
  border-radius:var(--radius-md);
  border:1px solid var(--vscode-input-border);
  background:var(--vscode-input-background);
  color:var(--vscode-input-foreground);
  font-size:12px;outline:none;
}
select:focus,input:focus{outline:2px solid var(--lux-primary);outline-offset:1px}
.btn{
  width:100%;padding:8px;
  border-radius:var(--radius-lg);
  border:none;font-size:12px;font-weight:700;
  cursor:pointer;
  transition:filter var(--transition-base),transform var(--transition-base),opacity var(--transition-base);
  margin-top:6px;
  display:flex;align-items:center;justify-content:center;gap:6px;
  user-select:none;-webkit-user-select:none;
  position:relative;overflow:hidden;
}
.btn:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}
.btn:disabled{opacity:.45;cursor:not-allowed;transform:none;filter:none}
.btn:focus-visible{outline:2px solid var(--lux-purple-soft);outline-offset:2px}
/* [FD-CO01 FIX] Gradientes usando tokens */
.btn-web    {background:linear-gradient(135deg,var(--lux-primary),var(--lux-accent-blue));color:#fff}
.btn-mobile {background:linear-gradient(135deg,var(--lux-accent-green),var(--lux-accent-cyan));color:#fff}
.btn-desktop{background:linear-gradient(135deg,var(--lux-accent-red),var(--lux-accent-orange));color:#fff}
.btn-api    {background:linear-gradient(135deg,var(--lux-accent-yellow),#ca8a04);color:#fff}
.btn-agent  {background:linear-gradient(135deg,var(--lux-primary),var(--lux-accent-pink));color:#fff;font-size:13px;padding:10px}
.btn-mcp    {background:var(--lux-surface);color:var(--vscode-foreground);border:1px solid var(--lux-border)}
.btn-save   {background:var(--vscode-button-secondaryBackground);color:var(--vscode-button-secondaryForeground)}
/* Skeleton shimmer */
.skeleton{
  background:linear-gradient(90deg,var(--lux-surface) 25%,#ffffff18 50%,var(--lux-surface) 75%);
  background-size:200% 100%;
  border-radius:var(--radius-md);height:32px;width:100%;margin-top:6px;
}
@media (prefers-reduced-motion:no-preference){
  .skeleton{animation:skeleton-shimmer 1.5s infinite}
  .btn:hover:not(:disabled){transform:translateY(-1px)}
}
/* [A11Y-05 / FD-A11Y05] prefers-reduced-motion */
@media (prefers-reduced-motion:reduce){
  .btn{transition:opacity .1s}
  .skeleton{animation:none}
}
@keyframes skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:6px}
/* [FD-LA05 FIX] Breakpoint sm */
@media(max-width:320px){.grid2{grid-template-columns:1fr}}
.divider{border:none;border-top:1px solid #ffffff0d;margin:14px 0}
.note{font-size:9px;color:var(--lux-text-note);margin-top:4px;line-height:1.5}
.provider-note{
  font-size:10px;color:var(--lux-purple-soft);
  margin-top:5px;padding:5px 8px;
  border-radius:var(--radius-sm);
  background:var(--lux-glow-soft);
}
.badge-new{
  background:var(--lux-primary);color:#fff;
  font-size:8px;padding:1px 5px;
  border-radius:var(--radius-sm);
  vertical-align:middle;margin-left:4px;
}
.section-title{font-size:10px;font-weight:700;text-transform:uppercase;opacity:.5;margin:14px 0 6px;letter-spacing:1px}
::selection{background:var(--lux-glow-primary);color:#fff}
</style>
</head>
<body>
<header>
  <h1>\u26a1 LuxCode AI</h1>
  <p class="sub">Generador IA \u00b7 Web \u00b7 Mobile \u00b7 Desktop \u00b7 API <span style="color:var(--lux-purple-soft);font-size:9px">v0.3.0</span></p>
</header>
<main>
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
    <div class="provider-note" id="pNote" role="status" aria-live="polite">Gratis: aistudio.google.com/app/apikey</div>
    <div id="keyBox">
      <label for="apiKey">\ud83d\udd11 API Key</label>
      <!-- [SK-08 DOC] Gemini key va en query string por protocolo oficial de Google AI.
           Aceptable en extensión VS Code local. Si se migra a servidor: usar header Authorization. -->
      <input type="password" id="apiKey" name="apiKey" placeholder="Pega tu API Key..." autocomplete="off" spellcheck="false" aria-label="API Key del proveedor seleccionado" />
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
    <button type="submit" class="btn btn-save" aria-label="Guardar configuraci\u00f3n">\ud83d\udcbe Guardar configuraci\u00f3n</button>
  </form>
  <hr class="divider">
  <section aria-label="Generar proyecto">
    <p class="section-title">\ud83d\ude80 Generar proyecto</p>
    <div class="grid2">
      <button class="btn btn-web" onclick="cmd('generateWeb',this)" aria-label="Generar p\u00e1gina web">\ud83c\udf10 Web</button>
      <button class="btn btn-mobile" onclick="cmd('generateMobile',this)" aria-label="Generar app m\u00f3vil">\ud83d\udcf1 M\u00f3vil</button>
    </div>
    <div class="grid2" style="margin-top:6px">
      <button class="btn btn-desktop" onclick="cmd('generateDesktop',this)" aria-label="Generar app escritorio">\ud83d\udda5 Desktop</button>
      <button class="btn btn-api" onclick="cmd('generateAPI',this)" aria-label="Generar API REST">\ud83d\udd0c API REST</button>
    </div>
  </section>
  <hr class="divider">
  <section aria-label="Modo Agente">
    <p class="section-title">\ud83e\udd16 Modo Agente <span class="badge-new" aria-label="Nuevo">NUEVO</span></p>
    <button class="btn btn-agent" onclick="cmd('agentTask',this)" aria-label="Ejecutar tarea compleja con agente IA">\ud83e\udd16 Ejecutar tarea con Agente</button>
    <p class="note" role="note">Planifica y ejecuta m\u00faltiples pasos autom\u00e1ticamente</p>
  </section>
  <hr class="divider">
  <section aria-label="MCP Servers">
    <p class="section-title">\ud83d\udd0c MCP Servers <span class="badge-new" aria-label="Nuevo">NUEVO</span></p>
    <button class="btn btn-mcp" onclick="cmd('mcpConnect',this)" aria-label="Conectar servidor MCP externo">+ Conectar servidor MCP</button>
    <p class="note" role="note">Compatible con Kilo.ai, Cline, Copilot Agent, Claude</p>
  </section>
</main>
<footer>
  <hr class="divider">
  <p style="font-size:9px;opacity:.3;text-align:center">LuxCode AI \u00b7 Open Source MIT \u00b7 luisitoys12</p>
</footer>
<script nonce="${nonce}">
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
  const p=document.getElementById('provider').value;
  document.getElementById('pNote').textContent=notes[p]||'';
  const local=['ollama','lmstudio'].includes(p);
  document.getElementById('keyBox').style.display=local?'none':'block';
  document.getElementById('ollamaBox').style.display=p==='ollama'?'block':'none';
}
function saveConfig(e){
  e.preventDefault();
  const btn=document.querySelector('[type="submit"]');
  btn.disabled=true;
  const orig=btn.textContent;
  btn.textContent='\u2705 Guardado';
  vscode.postMessage({command:'saveConfig',provider:document.getElementById('provider').value,key:document.getElementById('apiKey').value.trim(),ollamaModel:document.getElementById('ollamaModel').value});
  setTimeout(()=>{btn.disabled=false;btn.textContent=orig;},2000);
}
function cmd(c,btn){
  if(!btn)return vscode.postMessage({command:c});
  btn.disabled=true;
  const orig=btn.innerHTML;
  btn.innerHTML='<span style="width:60px;height:12px;display:inline-block;background:#ffffff22;border-radius:4px"></span>';
  vscode.postMessage({command:c});
  setTimeout(()=>{btn.disabled=false;btn.innerHTML=orig;},8000);
}
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

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
