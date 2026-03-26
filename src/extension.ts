import * as vscode from 'vscode';
import { LuxCodePanel } from './panels/LuxCodePanel';
import { AIService } from './services/AIService';
import { FileService } from './services/FileService';
import { MCPService } from './services/MCPService';
import { AgentService } from './services/AgentService';

const mcpService = new MCPService();

// [SK-01 FIX] Claves de Secrets API — cifradas por VS Code
const SECRET_KEYS: Record<string, string> = {
  gemini:     'luxcode.geminiApiKey',
  openai:     'luxcode.openaiApiKey',
  groq:       'luxcode.groqApiKey',
  openrouter: 'luxcode.openrouterApiKey',
};

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'luxcode.mainView',
      new LuxCodeSidebarProvider(context.extensionUri, context)
    )
  );

  reg(context, 'luxcode.openPanel',    () => LuxCodePanel.createOrShow(context.extensionUri, context));
  reg(context, 'luxcode.generateWeb',  () => runGenerator('web', context));
  reg(context, 'luxcode.generateMobile',  () => runGenerator('mobile', context));
  reg(context, 'luxcode.generateDesktop', () => runGenerator('desktop', context));
  reg(context, 'luxcode.generateAPI',  () => runAPIGenerator(context));
  reg(context, 'luxcode.agentTask',    () => runAgentTask(context));
  reg(context, 'luxcode.mcpConnect',   () => connectMCPServer());
  reg(context, 'luxcode.editWithAI',   () => runEditorAction('edit', '¿Qué cambios quieres hacer?', 'Ej: hazlo responsive'));
  reg(context, 'luxcode.explainCode',  () => runEditorAction('explain'));
  reg(context, 'luxcode.fixBug',       () => runEditorAction('fix', '¿Qué error tienes?', 'Pega el mensaje de error'));
}

function reg(ctx: vscode.ExtensionContext, cmd: string, fn: () => any) {
  ctx.subscriptions.push(vscode.commands.registerCommand(cmd, fn));
}

// [SK-01 FIX] Leer API key desde context.secrets (cifrado), no desde workspace config
async function getConfig(context: vscode.ExtensionContext): Promise<{ apiKey: string; provider: string }> {
  const cfg = vscode.workspace.getConfiguration('luxcode');
  const provider = cfg.get<string>('apiProvider', 'gemini');

  if (provider === 'ollama' || provider === 'lmstudio') {
    return { apiKey: 'local', provider };
  }

  // Leer desde Secrets API primero, fallback a workspace config (retrocompatibilidad)
  const secretKey = SECRET_KEYS[provider];
  const apiKey = secretKey
    ? (await context.secrets.get(secretKey) ?? cfg.get<string>(`${provider}ApiKey`, ''))
    : '';

  return { apiKey, provider };
}

async function withProgress(title: string, fn: () => Promise<void>) {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title, cancellable: false },
    async () => {
      try { await fn(); }
      catch (err: any) { vscode.window.showErrorMessage(`❌ ${err.message}`); }
    }
  );
}

async function runGenerator(type: 'web' | 'mobile' | 'desktop', ctx: vscode.ExtensionContext) {
  const opts: Record<string, string[]> = {
    web:     ['Landing Page', 'Portfolio', 'Dashboard', 'Blog', 'E-commerce', 'Radio/Streaming', 'PWA', 'Personalizado'],
    mobile:  ['React Native', 'Flutter', 'Ionic'],
    desktop: ['Tauri', 'Electron', 'Neutralino.js'],
  };
  const subtype = await vscode.window.showQuickPick(opts[type], { placeHolder: 'Elige el tipo de proyecto' });
  if (!subtype) { return; }
  const desc = await vscode.window.showInputBox({ prompt: '🤖 Describe tu proyecto', placeHolder: 'Ej: App de tareas con modo oscuro' });
  if (!desc) { return; }

  await withProgress(`🚀 Generando ${subtype}...`, async () => {
    const { apiKey, provider } = await getConfig(ctx);
    const ai = new AIService(provider, apiKey);
    const files = await ai.generate(type, subtype, desc);
    await FileService.save(type, subtype, files);
    vscode.window.showInformationMessage(`✅ ${subtype} generado. ¡Revisa tu workspace!`);
  });
}

async function runAPIGenerator(ctx: vscode.ExtensionContext) {
  const desc = await vscode.window.showInputBox({ prompt: '🔌 Describe tu API', placeHolder: 'Ej: API de blog con auth JWT' });
  if (!desc) { return; }
  const routesInput = await vscode.window.showInputBox({ prompt: 'Rutas (opcional)', placeHolder: 'GET /posts, POST /posts' });
  const routes = routesInput ? routesInput.split(',').map(r => r.trim()) : [];

  await withProgress('🔌 Generando API...', async () => {
    const { apiKey, provider } = await getConfig(ctx);
    const ai = new AIService(provider, apiKey);
    const files = await ai.generateAPI(desc, routes);
    await FileService.save('api', 'REST-API', files);
    vscode.window.showInformationMessage('✅ API generada.');
  });
}

async function runAgentTask(ctx: vscode.ExtensionContext) {
  const goal = await vscode.window.showInputBox({
    prompt: '🤖 ¿Qué quieres construir? (tarea compleja)',
    placeHolder: 'Ej: App de reservas con login, dashboard y base de datos',
  });
  if (!goal) { return; }

  const { apiKey, provider } = await getConfig(ctx);
  await withProgress('🤖 Agente planificando...', async () => {
    const agent = new AgentService(provider, apiKey);
    const task  = await agent.planTask(goal);
    vscode.window.showInformationMessage(`🤖 Plan: ${task.steps.length} pasos. Ejecutando...`);
    const files = await agent.executeTask(task, () => {});
    if (Object.keys(files).length > 0) {
      await FileService.save('web', 'agente', files);
    }
    vscode.window.showInformationMessage(`✅ Agente completó: ${task.steps.length} pasos`);
  });
}

async function connectMCPServer() {
  const name = await vscode.window.showInputBox({ prompt: 'Nombre del servidor MCP', placeHolder: 'mi-servidor' });
  if (!name) { return; }
  const url  = await vscode.window.showInputBox({ prompt: 'URL del servidor MCP', placeHolder: 'http://localhost:3000' });
  if (!url)  { return; }
  await mcpService.connectServer(name, url);
}

async function runEditorAction(action: string, prompt?: string, placeholder?: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  const selected = editor.document.getText(editor.selection);
  if (!selected) { vscode.window.showWarningMessage('Selecciona código primero'); return; }

  let instruction = '';
  if (prompt) {
    const inp = await vscode.window.showInputBox({ prompt, placeHolder: placeholder || '' });
    if (!inp) { return; }
    instruction = inp;
  }

  // getConfig necesita context — usar config pública para editor actions (no secretos)
  const cfg = vscode.workspace.getConfiguration('luxcode');
  const provider = cfg.get<string>('apiProvider', 'gemini');
  const apiKey   = cfg.get<string>(`${provider}ApiKey`, '');
  const ai = new AIService(provider, apiKey);

  await withProgress('✨ Procesando con IA...', async () => {
    let result = '';
    if (action === 'edit')    { result = await ai.editCode(selected, instruction); }
    else if (action === 'explain') { result = await ai.explainCode(selected); }
    else if (action === 'fix')     { result = await ai.fixBug(selected, instruction); }

    if (action === 'explain') {
      const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    } else {
      editor.edit(b => b.replace(editor.selection, result));
      vscode.window.showInformationMessage('✅ Código actualizado');
    }
  });
}

class LuxCodeSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private _uri: vscode.Uri, private _ctx: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };
    view.webview.html = LuxCodePanel.getWebviewContent(view.webview, this._uri);

    view.webview.onDidReceiveMessage(async (msg) => {
      const cmdMap: Record<string, string> = {
        generateWeb:     'luxcode.generateWeb',
        generateMobile:  'luxcode.generateMobile',
        generateDesktop: 'luxcode.generateDesktop',
        generateAPI:     'luxcode.generateAPI',
        agentTask:       'luxcode.agentTask',
        mcpConnect:      'luxcode.mcpConnect',
      };

      if (cmdMap[msg.command]) {
        await vscode.commands.executeCommand(cmdMap[msg.command]);

      } else if (msg.command === 'saveConfig') {
        const cfg = vscode.workspace.getConfiguration('luxcode');
        await cfg.update('apiProvider', msg.provider, true);

        // [SK-01 FIX] Guardar API key en Secrets API (cifrado), no en workspace config
        const secretKey = SECRET_KEYS[msg.provider];
        if (msg.key && secretKey) {
          await this._ctx.secrets.store(secretKey, msg.key);
          // [SK-01 FIX] Limpiar key del workspace config si existía antes (migración)
          await cfg.update(`${msg.provider}ApiKey`, undefined, true);
        }

        if (msg.ollamaModel) { await cfg.update('ollamaModel', msg.ollamaModel, true); }
        vscode.window.showInformationMessage('✅ Configuración guardada de forma segura 🔐');
      }
    });
  }
}

export function deactivate() {}
