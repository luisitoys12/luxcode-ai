import * as vscode from 'vscode';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface MCPServer {
  name: string;
  url: string;
  tools: MCPTool[];
}

export class MCPService {
  private servers: Map<string, MCPServer> = new Map();

  static readonly LUXCODE_MCP_TOOLS: MCPTool[] = [
    { name: 'generate_web_page', description: 'Generate a complete web page (HTML+CSS+JS)', inputSchema: { type: 'object', properties: { description: { type: 'string' }, subtype: { type: 'string' } }, required: ['description'] } },
    { name: 'generate_mobile_app', description: 'Generate a mobile app project', inputSchema: { type: 'object', properties: { description: { type: 'string' }, framework: { type: 'string' } }, required: ['description', 'framework'] } },
    { name: 'generate_desktop_app', description: 'Generate a desktop app', inputSchema: { type: 'object', properties: { description: { type: 'string' }, framework: { type: 'string' } }, required: ['description', 'framework'] } },
    { name: 'generate_api', description: 'Generate a REST API with Node.js/Express', inputSchema: { type: 'object', properties: { description: { type: 'string' } }, required: ['description'] } },
    { name: 'edit_code', description: 'Edit or improve a code snippet', inputSchema: { type: 'object', properties: { code: { type: 'string' }, instruction: { type: 'string' } }, required: ['code', 'instruction'] } },
    { name: 'fix_bug', description: 'Fix a bug in code', inputSchema: { type: 'object', properties: { code: { type: 'string' }, error: { type: 'string' } }, required: ['code', 'error'] } }
  ];

  async connectServer(name: string, url: string): Promise<void> {
    try {
      const res = await fetch(`${url}/tools/list`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} }) });
      if (!res.ok) { throw new Error(`HTTP ${res.status}`); }
      const data: any = await res.json();
      const tools: MCPTool[] = data.result?.tools || [];
      this.servers.set(name, { name, url, tools });
      vscode.window.showInformationMessage(`\u2705 MCP "${name}" conectado con ${tools.length} herramientas`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`\u274c MCP "${name}": ${err.message}`);
    }
  }

  getConnectedServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }
}
