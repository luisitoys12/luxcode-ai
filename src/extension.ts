import * as vscode from 'vscode';
import { LuxCodePanel } from './panels/LuxCodePanel';
import { AIService } from './services/AIService';
import { FileService } from './services/FileService';
import { MCPService } from './services/MCPService';
import { AgentService } from './services/AgentService';

const mcpService = new MCPService();

export function activate(context: vscode.ExtensionContext) {
  // Sidebar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('luxcode.mainView', new LuxCodeSidebarProvider(context.extensionUri, context))
  );

  reg(context, 'luxcode.openPanel', () => LuxCodePanel.createOrShow(context.extensionUri, context));
  reg(context, 'luxcode.generateWeb', () => runGenerator('web', context));
  reg(context, 'luxcode.generateMobile', () => runGenerator('mobile', context));
  reg(context, 'luxcode.generateDesktop', () => runGenerator('desktop', context));
  reg(context, 'luxcode.generateAPI', () => runAPIGenerator(context));
  reg(context, 'luxcode.agentTask', () => runAgentTask(context));
  reg(context, 'luxcode.mcpConnect', () => connectMCPServer());
  reg(context, 'luxcode.editWithAI', () => runEditorAction('edit', '\u00bfQu\u00e9 cambios quieres hacer?', 'Ej: hazlo responsive'));
  reg(context, 'luxcode.explainCode', () => runEditorAction('explain'));
  reg(context, 'luxcode.fixBug', () => runEditorAction('fix', '\u00bfQu\u00e9 error tienes?', 'Pega el mensaje de error'));
}

function reg(ctx: vscode.ExtensionContext, cmd: string, fn: () => any) {
  ctx.subscriptions.push(vscode.commands.registerCommand(cmd, fn));
}

function getConfig(): { apiKey: string; provider: string } {
  const cfg = vscode.workspace.getConfiguration('luxcode');
  const provider = cfg.get<string>('apiProvider', 'gemini');
  const keys: Record<string, string> = {
    gemini: cfg.get('geminiApiKey', ''),
    openai: cfg.get('openaiApiKey', ''),
    groq: cfg.get('groqApiKey', ''),
    openrouter: cfg.get('openrouterApiKey', ''),
    ollama: 'local',
    lmstudio: 'local'
  };
  return { apiKey: keys[provider] || '', provider };
}

async function withProgress(title: string, fn: () => Promise<void>) {
  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title, cancellable: false },
    async () => { try { await fn(); } catch (err: any) { vscode.window.showErrorMessage(`\u274c ${err.message}`); } }
  );
}

async function runGenerator(type: 'web' | 'mobile' | 'desktop', _ctx: vscode.ExtensionContext) {
  const opts: Record<string, string[]> = {
    web: ['Landing Page', 'Portfolio', 'Dashboard', 'Blog', 'E-commerce', 'Radio/Streaming', 'PWA', 'Personalizado'],
    mobile: ['React Native', 'Flutter', 'Ionic'],
    desktop: ['Tauri', 'Electron', 'Neutralino.js']
  };
  const subtype = await vscode.window.showQuickPick(opts[type], { placeHolder: 'Elige el tipo de proyecto' });
  if (!subtype) { return; }
  const desc = await vscode.window.showInputBox({ prompt: '\ud83e\udd16 Describe tu proyecto', placeHolder: 'Ej: App de tareas con modo oscuro' });
  if (!desc) { return; }
  await withProgress(`\ud83d\ude80 Generando ${subtype}...`, async () => {
    const { apiKey, provider } = getConfig();
    const ai = new AIService(provider, apiKey);
    const files = await ai.generate(type, subtype, desc);
    await FileService.save(type, subtype, files);
    vscode.window.showInformationMessage(`\u2705 ${subtype} generado. \u00a1Revisa tu workspace!`);
  });
}

async function runAPIGenerator(_ctx: vscode.ExtensionContext) {
  const desc = await vscode.window.showInputBox({ prompt: '\ud83d\udd0c Describe tu API', placeHolder: 'Ej: API de blog con auth JWT' });
  if (!desc) { return; }
  const routesInput = await vscode.window.showInputBox({ prompt: 'Rutas (opcional)', placeHolder: 'GET /posts, POST /posts' });
  const routes = routesInput ? routesInput.split(',').map(r => r.trim()) : [];
  await withProgress('\ud83d\udd0c Generando API...', async () => {
    const { apiKey, provider } = getConfig();
    const ai = new AIService(provider, apiKey);
    const files = await ai.generateAPI(desc, routes);
    await FileService.save('api', 'REST-API', files);
    vscode.window.showInformationMessage('\u2705 API generada.');
  });
}

async function runAgentTask(_ctx: vscode.ExtensionContext) {
  const goal = await vscode.window.showInputBox({
    prompt: '\ud83e\udd16 \u00bfQu\u00e9 quieres construir? (tarea compleja)',
    placeHolder: 'Ej: App de reservas con login, dashboard y base de datos'
  });
  if (!goal) { return; }
  const { apiKey, provider } = getConfig();
  await withProgress('\ud83e\udd16 Agente planificando...', async () => {
    const agent = new AgentService(provider, apiKey);
    const task = await agent.planTask(goal);
    vscode.window.showInformationMessage(`\ud83e\udd16 Plan: ${task.steps.length} pasos. Ejecutando...`);
    const files = await agent.executeTask(task, () => {});
    if (Object.keys(files).length > 0) {
      await FileService.save('web', 'agente', files);
    }
    vscode.window.showInformationMessage(`\u2705 Agente complet\u00f3: ${task.steps.length} pasos`);
  });
}

async function connectMCPServer() {
  const name = await vscode.window.showInputBox({ prompt: 'Nombre del servidor MCP', placeHolder: 'mi-servidor' });
  if (!name) { return; }
  const url = await vscode.window.showInputBox({ prompt: 'URL del servidor MCP', placeHolder: 'http://localhost:3000' });
  if (!url) { return; }
  await mcpService.connectServer(name, url);
}

async function runEditorAction(action: string, prompt?: string, placeholder?: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { return; }
  const selected = editor.document.getText(editor.selection);
  if (!selected) { vscode.window.showWarningMessage('Selecciona c\u00f3digo primero'); return; }
  let instruction = '';
  if (prompt) {
    const inp = await vscode.window.showInputBox({ prompt, placeHolder: placeholder || '' });
    if (!inp) { return; }
    instruction = inp;
  }
  const { apiKey, provider } = getConfig();
  const ai = new AIService(provider, apiKey);
  await withProgress('\u2728 Procesando con IA...', async () => {
    let result = '';
    if (action === 'edit') { result = await ai.editCode(selected, instruction); }
    else if (action === 'explain') { result = await ai.explainCode(selected); }
    else if (action === 'fix') { result = await ai.fixBug(selected, instruction); }
    if (action === 'explain') {
      const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    } else {
      editor.edit(b => b.replace(editor.selection, result));
      vscode.window.showInformationMessage('\u2705 C\u00f3digo actualizado');
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
        generateWeb: 'luxcode.generateWeb',
        generateMobile: 'luxcode.generateMobile',
        generateDesktop: 'luxcode.generateDesktop',
        generateAPI: 'luxcode.generateAPI',
        agentTask: 'luxcode.agentTask',
        mcpConnect: 'luxcode.mcpConnect'
      };
      if (cmdMap[msg.command]) {
        await vscode.commands.executeCommand(cmdMap[msg.command]);
      } else if (msg.command === 'saveConfig') {
        const cfg = vscode.workspace.getConfiguration('luxcode');
        await cfg.update('apiProvider', msg.provider, true);
        const keyMap: Record<string, string> = { gemini: 'geminiApiKey', openai: 'openaiApiKey', groq: 'groqApiKey', openrouter: 'openrouterApiKey' };
        if (msg.key && keyMap[msg.provider]) { await cfg.update(keyMap[msg.provider], msg.key, true); }
        if (msg.ollamaModel) { await cfg.update('ollamaModel', msg.ollamaModel, true); }
        vscode.window.showInformationMessage('\u2705 Configuraci\u00f3n guardada');
      }
    });
  }
}

export function deactivate() {}
