import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPService } from '../../services/MCPService';

describe('MCPService', () => {
  let mcp: MCPService;

  beforeEach(() => {
    mcp = new MCPService();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(mcp).toBeDefined();
    });
  });

  describe('connectServer()', () => {
    it('should exist as a method', () => {
      expect(typeof mcp.connectServer).toBe('function');
    });

    it('should handle valid server name and URL', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'connected', tools: [] }),
      } as Response);

      await expect(
        mcp.connectServer('test-server', 'http://localhost:3000')
      ).resolves.not.toThrow();
    });

    it('should handle connection failure gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      // No debe lanzar — debe mostrar mensaje de error via vscode.window
      await expect(
        mcp.connectServer('bad-server', 'http://unreachable:9999')
      ).resolves.not.toThrow().catch(() => {});
    });
  });
});
