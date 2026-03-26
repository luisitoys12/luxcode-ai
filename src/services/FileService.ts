import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileService {
  static async save(type: string, subtype: string, files: Record<string, string>): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let baseDir: string;

    const folderName = `luxcode-${type}-${subtype.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    if (workspaceFolders && workspaceFolders.length > 0) {
      baseDir = path.join(workspaceFolders[0].uri.fsPath, folderName);
    } else {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '~';
      baseDir = path.join(homeDir, 'luxcode-output', folderName);
    }

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    for (const [filename, content] of Object.entries(files)) {
      const filePath = path.join(baseDir, filename);
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf8');
    }

    // Abrir el folder en VS Code
    const uri = vscode.Uri.file(baseDir);
    await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: false });
  }
}
