import * as vscode from 'vscode';
import { LuxCodePanel } from './panels/LuxCodePanel';
import { AIService } from './services/AIService';
import { FileService } from './services/FileService';

export function activate(context: vscode.ExtensionContext) {
  console.log('⚡ LuxCode AI v0.2.0 activado');

  // Sidebar
  const sidebarProvider = new LuxCodeSidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('luxcode.mainView', sidebarProvider)
  );

  // Comando: Abrir Panel
  register(context, 'luxcode.openPanel', () => {
    LuxCodePanel.createOrShow(context.extensionUri, context);
  });

  // Comando: Generar Página Web
  register(context, 'luxcode.generateWeb', async () => {
    await runGenerator('web', context);
  });

  // Comando: Generar App Móvil
  register(context, 'luxcode.generateMobile', async () => {
    await runGenerator('mobile', context);
  });

  // Comando: Generar App Escritorio
  register(context, 'luxcode.generateDesktop', async () => {
    await runGenerator('desktop', context);
  });

  // Comando: Editar con IA
  register(context, 'luxcode.editWithAI', async () => {
    await runEditorAction('edit', '¿Qué cambios quieres hacer?', 'Ej: Hazlo responsive, agrega animaciones...');
  });

  // Comando: Explicar código
  register(context, 'luxcode.explainCode', async () => {
    await runEditorAction('explain', null, null, true);
  });

  // Comando: Fix Bug
  register(context, 'luxcode.fixBug', async () => {
    await runEditorAction('fix', '¿Qué error tienes?', 'Pega el mensaje de error o describe el problema');
  });
}

function register(ctx: vscode.ExtensionContext, cmd: string, fn: (...args: any[]) => any) {
  ctx.subscriptions.push(vscode.commands.registerCommand(cmd, fn));
}

async function runGenerator(type: 'web' | 'mobile' | 'desktop', context: vscode.ExtensionContext) {
  const targets = {
    web: {
      label: '🌐 Tipo de proyecto web',
      options: ['Landing Page', 'Portfolio', 'Dashboard', 'Blog', 'E-commerce', 'Radio/Streaming', 'PWA', 'Personalizado']
    },
    mobile: {
      label: '📱 Framework móvil',
      options: ['React Native (JavaScript)', 'Flutter (Dart)', 'Ionic (HTML/CSS/JS)']
    },
    desktop: {
      label: '🖥 Framework de escritorio',
      options: ['Tauri (Rust + Web)', 'Electron (Node.js)', 'Neutralino.js (Ligero)']
    }
  };

  const target = targets[type];
  const subtype = await vscode.window.showQuickPick(target.options, { placeHolder: target.label });
  if (!subtype) return;

  const description = await vscode.window.showInputBox({
    prompt: `🤖 Describe tu ${type === 'web' ? 'página' : type === 'mobile' ? 'app móvil' : 'app de escritorio'}`,
    placeHolder: 'Ej: App de gestión de tareas con modo oscuro y notificaciones'
  });
  if (!description) return;

  const { apiKey, provider } = getApiConfig();
  if (!apiKey && !['ollama', 'lmstudio'].includes(provider)) {
    vscode.window.showErrorMessage(`⚠️ Configura tu API Key de ${provider} en Ajustes > LuxCode AI`);
    return;
  }

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: `🚀 LuxCode AI generando tu ${subtype}...`,
    cancellable: false
  }, async () => {
    try {
      const ai = new AIService(provider, apiKey);
      const result = await ai.generate(type, subtype, description);
      await FileService.save(type, subtype, result);
      vscode.window.showInformationMessage(`✅ ${subtype} generado. ¡Revisa tu workspace!`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`❌ Error: ${err.message}`);
    }
  });
}

async function runEditorAction(action: string, prompt: string | null, placeholder: string | null, noInput = false) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const selectedText = editor.document.getText(editor.selection);
  if (!selectedText) { vscode.window.showWarningMessage('Selecciona código primero'); return; }

  let instruction = '';
  if (!noInput && prompt) {
    const input = await vscode.window.showInputBox({ prompt, placeHolder: placeholder || '' });
    if (!input) return;
    instruction = input;
  }

  const { apiKey, provider } = getApiConfig();
  const ai = new AIService(provider, apiKey);

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: '✨ LuxCode AI procesando...',
    cancellable: false
  }, async () => {
    try {
      let result = '';
      if (action === 'edit') result = await ai.editCode(selectedText, instruction);
      else if (action === 'explain') result = await ai.explainCode(selectedText);
      else if (action === 'fix') result = await ai.fixBug(selectedText, instruction);

      if (action === 'explain') {
        const doc = await vscode.workspace.openTextDocument({ content: result, language: 'markdown' });
        vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      } else {
        editor.edit(b => b.replace(editor.selection, result));
        vscode.window.showInformationMessage('✅ Código actualizado');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`❌ Error: ${err.message}`);
    }
  });
}

function getApiConfig(): { apiKey: string; provider: string } {
  const config = vscode.workspace.getConfiguration('luxcode');
  const provider = config.get<string>('apiProvider', 'gemini');
  const keyMap: Record<string, string> = {
    gemini: config.get<string>('geminiApiKey', ''),
    openai: config.get<string>('openaiApiKey', ''),
    groq: config.get<string>('groqApiKey', ''),
    openrouter: config.get<string>('openrouterApiKey', ''),
    ollama: 'local',
    lmstudio: 'local'
  };
  return { apiKey: keyMap[provider] || '', provider };
}

class LuxCodeSidebarProvider implements vscode.WebviewViewProvider {
  constructor(private readonly _uri: vscode.Uri, private readonly _ctx: vscode.ExtensionContext) {}
  resolveWebviewView(view: vscode.WebviewView) {
    view.webview.options = { enableScripts: true };
    view.webview.html = LuxCodePanel.getWebviewContent(view.webview, this._uri);
    view.webview.onDidReceiveMessage(async (msg) => handleMessage(msg));
  }
}

async function handleMessage(msg: any) {
  const config = vscode.workspace.getConfiguration('luxcode');
  switch (msg.command) {
    case 'generateWeb': await vscode.commands.executeCommand('luxcode.generateWeb'); break;
    case 'generateMobile': await vscode.commands.executeCommand('luxcode.generateMobile'); break;
    case 'generateDesktop': await vscode.commands.executeCommand('luxcode.generateDesktop'); break;
    case 'saveConfig':
      await config.update('apiProvider', msg.provider, true);
      if (msg.key && msg.provider === 'gemini') await config.update('geminiApiKey', msg.key, true);
      if (msg.key && msg.provider === 'openai') await config.update('openaiApiKey', msg.key, true);
      if (msg.key && msg.provider === 'groq') await config.update('groqApiKey', msg.key, true);
      if (msg.key && msg.provider === 'openrouter') await config.update('openrouterApiKey', msg.key, true);
      if (msg.ollamaModel) await config.update('ollamaModel', msg.ollamaModel, true);
      vscode.window.showInformationMessage('✅ Configuración guardada');
      break;
  }
}

export function deactivate() {}
