import * as vscode from 'vscode';

export class FileService {
  static async save(type: string, subtype: string, files: Record<string, string>): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) throw new Error('Abre una carpeta en VS Code primero');

    const slug = subtype.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, '-');
    const folder = vscode.Uri.joinPath(folders[0].uri, `luxcode-${slug}-${ts}`);

    await vscode.workspace.fs.createDirectory(folder);

    for (const [filename, content] of Object.entries(files)) {
      if (!content || !filename) continue;
      // Crear subcarpetas si el archivo tiene path
      const parts = filename.split('/');
      if (parts.length > 1) {
        const subdir = vscode.Uri.joinPath(folder, ...parts.slice(0, -1));
        await vscode.workspace.fs.createDirectory(subdir);
      }
      await vscode.workspace.fs.writeFile(
        vscode.Uri.joinPath(folder, filename),
        Buffer.from(content, 'utf-8')
      );
    }

    // Abrir el archivo principal
    const mainFile = files['index.html'] ? 'index.html'
      : files['App.js'] ? 'App.js'
      : files['src/main.rs'] ? 'src/main.rs'
      : Object.keys(files)[0];

    if (mainFile) {
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.joinPath(folder, mainFile));
      await vscode.window.showTextDocument(doc);
    }
  }
}
