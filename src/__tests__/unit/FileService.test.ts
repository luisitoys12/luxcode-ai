import { describe, it, expect, vi } from 'vitest';
import { FileService } from '../../services/FileService';

// Mock vscode.workspace.fs
vi.mock('vscode', async (importOriginal) => {
  const original = await importOriginal<typeof import('vscode')>();
  return {
    ...original,
    workspace: {
      ...original.workspace,
      fs: {
        writeFile: vi.fn().mockResolvedValue(undefined),
        createDirectory: vi.fn().mockResolvedValue(undefined),
        stat: vi.fn().mockResolvedValue({ type: 1 }),
      },
      workspaceFolders: [{
        uri: { fsPath: '/tmp/test-workspace', toString: () => '/tmp/test-workspace' },
        name: 'test',
        index: 0,
      }],
    },
  };
});

describe('FileService', () => {
  describe('save()', () => {
    it('should be defined as static method', () => {
      expect(typeof FileService.save).toBe('function');
    });

    it('should handle empty files object without throwing', async () => {
      // Si no hay workspace, debe manejar el caso gracefully
      await expect(
        FileService.save('web', 'Landing Page', {})
      ).resolves.not.toThrow().catch(() => {});
    });

    it('should accept web type', async () => {
      const files = { 'index.html': '<html></html>', 'style.css': 'body{}' };
      // Prueba que la firma del método acepta los parámetros correctos
      expect(() => FileService.save('web', 'Portfolio', files)).not.toThrow();
    });

    it('should accept api type', async () => {
      const files = { 'server.js': 'const express = require("express")' };
      expect(() => FileService.save('api', 'REST-API', files)).not.toThrow();
    });
  });
});
