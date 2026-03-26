import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// [FS-02] Sanitiza nombres de archivo generados por IA
// Elimina caracteres peligrosos: ../ \ : * ? " < > | y secuencias de path traversal
function sanitizeFilename(name: string): string {
  return name
    .replace(/\.\.\/|\.\.\\/g, '')   // eliminar ../ y ..\
    .replace(/[\\:*?"<>|]/g, '-')    // reemplazar chars peligrosos
    .replace(/^\/+/, '')              // no empezar con /
    .trim();
}

// [FS-04] Verifica que la ruta resultante esté dentro del baseDir (no path traversal)
function assertInsideBase(resolvedPath: string, baseDir: string): void {
  const relative = path.relative(baseDir, resolvedPath);
  const isOutside = relative.startsWith('..') || path.isAbsolute(relative);
  if (isOutside) {
    throw new Error(`[LuxCode Security] Ruta fuera del directorio base: ${resolvedPath}`);
  }
}

export class FileService {
  static async save(type: string, subtype: string, files: Record<string, string>): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    let baseDir: string;

    // [FS-03] Sanitizar type y subtype antes de usarlos en la ruta
    const safeType    = type.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 32);
    const safeSubtype = subtype.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 64);
    const folderName  = `luxcode-${safeType}-${safeSubtype}-${Date.now()}`;

    if (workspaceFolders && workspaceFolders.length > 0) {
      baseDir = path.join(workspaceFolders[0].uri.fsPath, folderName);
    } else {
      // [FS-01] Fallback fuera del workspace: usar carpeta Documents del usuario, no HOME directamente
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      if (!homeDir) { throw new Error('[LuxCode] No se pudo determinar el directorio del usuario'); }
      baseDir = path.join(homeDir, 'Documents', 'luxcode-output', folderName);
    }

    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    for (const [rawFilename, content] of Object.entries(files)) {
      // [FS-02] Sanitizar nombre de archivo generado por IA
      const safeFilename = sanitizeFilename(rawFilename);
      if (!safeFilename) { continue; } // skip si queda vacío tras sanitizar

      const filePath = path.resolve(baseDir, safeFilename);

      // [FS-04] Verificar que la ruta resuelta esté DENTRO del baseDir
      assertInsideBase(filePath, baseDir);

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
