import * as vscode from 'vscode';
import * as path from 'path';

export class FileService {
  static async saveGeneratedFiles(result: { html: string; css: string; js: string }): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      throw new Error('Abre una carpeta en VS Code antes de generar archivos');
    }

    const root = workspaceFolders[0].uri;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const folder = vscode.Uri.joinPath(root, `luxcode-${timestamp}`);

    // Crear carpeta
    await vscode.workspace.fs.createDirectory(folder);

    // Guardar index.html
    const htmlContent = result.html.includes('<link rel="stylesheet"')
      ? result.html
      : result.html.replace('</head>', '  <link rel="stylesheet" href="style.css">\n</head>')
          .replace('</body>', '  <script src="script.js"></script>\n</body>');

    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(folder, 'index.html'),
      Buffer.from(htmlContent, 'utf-8')
    );

    if (result.css) {
      await vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(folder, 'style.css'),
        Buffer.from(result.css, 'utf-8')
      );
    }

    if (result.js) {
      await vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(folder, 'script.js'),
        Buffer.from(result.js, 'utf-8')
      );
    }

    // Abrir el HTML generado
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(folder, 'index.html'));
    await vscode.window.showTextDocument(doc);
  }
}
