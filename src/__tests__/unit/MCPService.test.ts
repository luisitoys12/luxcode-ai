import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPService } from '../../services/MCPService';

describe('MCPService', () => {
  let mcp: MCPService;

  beforeEach(() => {
    mcp = new MCPService();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create empty instance', () => {
      expect(mcp).toBeDefined();
      expect(mcp.getConnectedServers()).toHaveLength(0);
    });
  });

  describe('LUXCODE_MCP_TOOLS static', () => {
    it('should have at least 4 tools defined', () => {
      expect(MCPService.LUXCODE_MCP_TOOLS.length).toBeGreaterThanOrEqual(4);
    });

    it('should include generate_web_page tool', () => {
      const names = MCPService.LUXCODE_MCP_TOOLS.map(t => t.name);
      expect(names).toContain('generate_web_page');
    });
  });

  describe('connectServer()', () => {
    it('should add server on successful connection', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ result: { tools: [{ name: 'test-tool', description: 'Test', inputSchema: {} }] } }),
      } as Response);

      await mcp.connectServer('my-server', 'http://localhost:3000');
      expect(mcp.getConnectedServers()).toHaveLength(1);
      expect(mcp.getConnectedServers()[0].name).toBe('my-server');
    });

    it('should show error on HTTP failure — no throw', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false, status: 500,
        json: async () => ({}),
      } as Response);

      // connectServer no lanza — muestra vscode.window.showErrorMessage internamente
      await expect(mcp.connectServer('bad', 'http://localhost:9999')).resolves.toBeUndefined();
    });

    it('should show error on network failure — no throw', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('ECONNREFUSED'));
      await expect(mcp.connectServer('down', 'http://localhost:1')).resolves.toBeUndefined();
    });
  });

  describe('getConnectedServers()', () => {
    it('should return array', () => {
      expect(Array.isArray(mcp.getConnectedServers())).toBe(true);
    });
  });
});
