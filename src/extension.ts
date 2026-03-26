import * as vscode from 'vscode';
import { LuxCodePanel } from './panels/LuxCodePanel';
import { AIService } from './services/AIService';
import { FileService } from './services/FileService';

export function activate(context: vscode.ExtensionContext) {
  console.log('LuxCode AI activado ✅');

  // Comando: Abrir Panel principal
  const openPanelCmd = vscode.commands.registerCommand('luxcode.openPanel', () => {
    LuxCodePanel.createOrShow(context.extensionUri, context);
  });

  // Comando: Generar página web
  const generatePageCmd = vscode.commands.registerCommand('luxcode.generatePage', async () => {
    const description = await vscode.window.showInputBox({
      prompt: '🤖 Describe la página web que quieres crear',
      placeHolder: 'Ej: Landing page para una radio de música electrónica con reproductor y newsletter'
    });
    if (!description) return;

    const config = vscode.workspace.getConfiguration('luxcode');
    const provider = config.get<string>('apiProvider', 'gemini');
    const geminiKey = config.get<string>('geminiApiKey', '');
    const openaiKey = config.get<string>('openaiApiKey', '');

    const apiKey = provider === 'gemini' ? geminiKey : openaiKey;
    if (!apiKey) {
      vscode.window.showErrorMessage(`⚠️ Configura tu API Key de ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} en Ajustes > LuxCode AI`);
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '🚀 LuxCode AI generando tu página...',
      cancellable: false
    }, async () => {
      try {
        const aiService = new AIService(provider, apiKey);
        const result = await aiService.generateWebPage(description);
        await FileService.saveGeneratedFiles(result);
        vscode.window.showInformationMessage('✅ Página generada correctamente. ¡Revisa tu workspace!');
      } catch (err: any) {
        vscode.window.showErrorMessage(`❌ Error: ${err.message}`);
      }
    });
  });

  // Comando: Editar selección con IA
  const editWithAICmd = vscode.commands.registerCommand('luxcode.editWithAI', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const selection = editor.selection;
    const selectedText = editor.document.getText(selection);
    if (!selectedText) {
      vscode.window.showWarningMessage('Selecciona el código que quieres mejorar');
      return;
    }

    const instruction = await vscode.window.showInputBox({
      prompt: '¿Qué cambios quieres hacer al código seleccionado?',
      placeHolder: 'Ej: Hazlo responsive, agrega animaciones, mejora el diseño...'
    });
    if (!instruction) return;

    const config = vscode.workspace.getConfiguration('luxcode');
    const provider = config.get<string>('apiProvider', 'gemini');
    const geminiKey = config.get<string>('geminiApiKey', '');
    const openaiKey = config.get<string>('openaiApiKey', '');
    const apiKey = provider === 'gemini' ? geminiKey : openaiKey;

    if (!apiKey) {
      vscode.window.showErrorMessage('⚠️ Configura tu API Key en Ajustes > LuxCode AI');
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '✏️ LuxCode AI editando código...',
      cancellable: false
    }, async () => {
      try {
        const aiService = new AIService(provider, apiKey);
        const improved = await aiService.editCode(selectedText, instruction);
        editor.edit(editBuilder => {
          editBuilder.replace(selection, improved);
        });
        vscode.window.showInformationMessage('✅ Código actualizado con IA');
      } catch (err: any) {
        vscode.window.showErrorMessage(`❌ Error: ${err.message}`);
      }
    });
  });

  // Registrar sidebar view
  const sidebarProvider = new LuxCodeSidebarProvider(context.extensionUri, context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('luxcode.mainView', sidebarProvider)
  );

  context.subscriptions.push(openPanelCmd, generatePageCmd, editWithAICmd);
}

class LuxCodeSidebarProvider implements vscode.WebviewViewProvider {
  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _context: vscode.ExtensionContext
  ) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = LuxCodePanel.getWebviewContent(webviewView.webview, this._extensionUri);

    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.command) {
        case 'generate':
          await vscode.commands.executeCommand('luxcode.generatePage');
          break;
        case 'saveKey':
          const config = vscode.workspace.getConfiguration('luxcode');
          await config.update(message.provider === 'gemini' ? 'geminiApiKey' : 'openaiApiKey', message.key, true);
          await config.update('apiProvider', message.provider, true);
          webviewView.webview.postMessage({ command: 'keySaved', success: true });
          break;
      }
    });
  }
}

export function deactivate() {}
