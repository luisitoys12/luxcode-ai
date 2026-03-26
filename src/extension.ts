import * as vscode from 'vscode';
import { LuxCodePanel } from './panels/LuxCodePanel';
import { AIService } from './services/AIService';
import { FileService } from './services/FileService';
import { MCPService } from './services/MCPService';
import { AgentService } from './services/AgentService';

const mcpService = new MCPService();

export function activate(context: vscode.ExtensionContext) {
  console.log('⚡ LuxCode AI v0.3.0 activado');

  // Sidebar
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('luxcode.mainView', new LuxCodeSidebarProvider(context.extensionUri, context))
  );

  register(context, 'luxcode.openPanel', () => LuxCodePanel.createOrShow(context.extensionUri, context));
  register(context, 'luxcode.generateWeb', () => runGenerator('web', context));
  register(context, 'luxcode.generateMobile', () => runGenerator('mobile', context));
  register(context, 'luxcode.generateDesktop', () => runGenerator('desktop', context));
  register(context, 'luxcode.generateAPI', () => runAPIGenerator(context));
  register(context, 'luxcode.agentTask', () => runAgentTask(context));
  register(context, 'luxcode.mcpConnect', () => connectMCPServer());
  register(context, 'luxcode.editWithAI', () => runEditorAction('edit', '¿Qué cambios quieres hacer?', 'Ej: Hazlo responsive, agrega animaciones...'));
  register(context, 'luxcode.explainCode', () => runEditorAction('explain'));
  register(context, 'luxcode.fixBug', () => runEditorAction('fix', '¿Qué error tienes?', 'Pega el mensaje de error'));
}

function register(ctx: vscode.ExtensionContext, cmd: string, fn: () => any) {
  ctx.subscriptions.push(vscode.commands.registerCommand(cmd, fn));
}

async function runGenerator(type: 'web' | 'mobile' | 'desktop', _ctx: vscode.ExtensionContext) {
  const opts: Record<string, string[]> = {
    web: ['Landing Page', 'Portfolio', 'Dashboard', 'Blog', 'E-commerce', 'Radio/Streaming', 'PWA', 'Personalizado'],
    mobile: ['React Native', 'Flutter', 'Ionic'],
    desktop: ['Tauri (Rust + Web)', 'Electron (Node.js)', 'Neutralino.js']
  };
  const subtype = await vscode.window.showQuickPick(opts[type], { placeHolder: 'Elige el tipo de proyecto' });
  if (!subtype) return;
  const desc = await vscode.window.showInputBox({ prompt: '🤖 Describe tu proyecto', placeHolder: 'Ej: App de gestión de tareas con modo oscuro' });
  if (!desc) return;
  await runWithProgress(`🚀 Generando ${subtype}...`, async () => {
    const { apiKey, provider } = getApiConfig();
    const ai = new AIService(provider, apiKey);
    const files = await ai.generate(type, subtype, desc);
    await FileService.save(type, subtype, files);
    vscode.window.showInformationMessage(`✅ ${subtype} generado. ¡Revisa tu workspace!`);
  });
}

async function runAPIGenerator(_ctx: vscode.ExtensionContext) {
  const desc = await vscode.window.showInputBox({ prompt: '🔌 Describe tu API', placeHolder: 'Ej: API REST para blog con auth JWT y CRUD de posts' });
  if (!desc) return;
  const routesInput = await vscode.window.showInputBox({ prompt: 'Rutas a generar (opcional)', placeHolder: 'Ej: GET /posts, POST /posts, DELETE /posts/:id' });
  const routes = routesInput ? routesInput.split(',').map(r => r.trim()) : [];
  await runWithProgress('🔌 Generando API...', async () => {
    const { apiKey, provider } = getApiConfig();
    const ai = new AIService(provider, apiKey);
    const files = await ai.generateAPI(desc, routes);
    await FileService.save('api', 'Node.js API', files);
    vscode.window.showInformationMessage('✅ API generada. ¡Revisa tu workspace!');
  });
}

async function runAgentTask(_ctx: vscode.ExtensionContext) {
  const goal = await vscode.window.showInputBox({
    prompt: '🤖 ¿Qué quieres que el agente construya? (tarea compleja)',
    placeHolder: 'Ej: Crea una web app completa de reservas con base de datos, auth y dashboard admin'
  });
  if (!goal) return;

  const { apiKey, provider } = getApiConfig();
  if (!apiKey && !['ollama', 'lmstudio'].includes(provider)) {
    vscode.window.showErrorMessage('⚠️ Configura tu API Key primero');
    return;
  }

  // Mostrar panel con progreso del agente
  LuxCodePanel.createOrShow(vscode.Uri.file(''), _ctx);

  await runWithProgress('🤖 Agente planificando tarea...', async () => {
    const agent = new AgentService(provider, apiKey);
    const task = await agent.planTask(goal);

    vscode.window.showInformationMessage(`🤖 Plan: ${task.steps.length} pasos. Ejecutando...`);

    const files = await agent.executeTask(task, (steps) => {
      const done = steps.filter(s => s.status === 'done').length;
      console.log(`Progreso: ${done}/${steps.length}`);
    });

    if (Object.keys(files).length > 0) {
      await FileService.save('web', 'agent-task', files);
    }
    vscode.window.showInformationMessage(`✅ Agente completó la tarea: ${task.steps.length} pasos ejecutados`);
  });
}

async function connectMCPServer() {
  const name = await vscode.window.showInputBox({ prompt: 'Nombre del servidor MCP', placeHolder: 'Ej: mi-servidor-mcp' });
  if (!name) return;
  const url = await vscode.window.showInputBox({ prompt: 'URL del servidor MCP', placeHolder: 'http://localhost:3000' });
  if (!url) return;
  await mcpService.connectServer(name, url);
}

async function runEditorAction(action: string, prompt?: string, placeholder?: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const selected = editor.document.getText(editor.selection);
  if (!selected) { vscode.window.showWarningMessage('Selecciona código primero'); return; }
  let instruction = '';
  if (prompt) {
    const inp = await vscode.window.showInputBox({ prompt, placeHolder: placeholder || '' });
    if (!inp) return;
    instruction = inp;
  }
  const { apiKey, provider } = getApiConfig();
  const ai = new AIService(provider, apiKey);
  await runWithProgress('✨ Procesando con IA...', async () => {
    let result = '';
    if (action === 'edit') result = await ai.editCode(selected, instruction);
    else if (action === 'explain') result = await ai.explainCode(selected);
    else if (action === 'fix') result = await ai.fixBug(selected, instruction);
    if (action === 'explain') {
      const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
      vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
    } else {
      editor.edit(b => b.replace(editor.selection, result));
      vscode.window.showInformationMessage('✅ Código actualizado');
    }
  });
}

async function runWithProgress(title: string, fn: () => Promise<void>) {
  await vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title, cancellable: false }, async () => {
    try { await fn(); } catch (err: any) { vscode.window.showErrorMessage(`❌ Error: ${err.message}`); }
  });
}

function getApiConfig(): { apiKey: string; provider: string } {
  const cfg = vscode.workspace.getConfiguration('luxcode');
  const provider = cfg.get<string>('apiProvider', 'gemini');
  const keys: Record<string, string> = {
    gemini: cfg.get('geminiApiKey', ''),
    openai: cfg.get('openaiApiKey', ''),
    groq: cfg.get('groqApiKey', ''),
    openrouter: cfg.get('openrouterApiKey', ''),
    ollama: 'local', lmstudio: 'local'
  };
  return { apiKey: keys[provider] || '', provider };
}

class LuxCodeSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private _uri: vscode.Uri, private _ctx: vscode.ExtensionContext) {}
  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };
    view.webview.html = LuxCodePanel.getWebviewContent(view.webview, this._uri);
    view.webview.onDidReceiveMessage(async (msg) => {
      switch(msg.command) {
        case 'generateWeb': await vscode.commands.executeCommand('luxcode.generateWeb'); break;
        case 'generateMobile': await vscode.commands.executeCommand('luxcode.generateMobile'); break;
        case 'generateDesktop': await vscode.commands.executeCommand('luxcode.generateDesktop'); break;
        case 'generateAPI': await vscode.commands.executeCommand('luxcode.generateAPI'); break;
        case 'agentTask': await vscode.commands.executeCommand('luxcode.agentTask'); break;
        case 'mcpConnect': await vscode.commands.executeCommand('luxcode.mcpConnect'); break;
        case 'saveConfig': {
          const cfg = vscode.workspace.getConfiguration('luxcode');
          await cfg.update('apiProvider', msg.provider, true);
          if (msg.key) {
            const keyMap: Record<string,string> = { gemini:'geminiApiKey', openai:'openaiApiKey', groq:'groqApiKey', openrouter:'openrouterApiKey' };
            if (keyMap[msg.provider]) await cfg.update(keyMap[msg.provider], msg.key, true);
          }
          if (msg.ollamaModel) await cfg.update('ollamaModel', msg.ollamaModel, true);
          vscode.window.showInformationMessage('✅ Configuración guardada');
          break;
        }
      }
    });
  }
}

export function deactivate() {}
