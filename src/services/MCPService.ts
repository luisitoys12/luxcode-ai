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

/**
 * MCPService - Model Context Protocol integration for LuxCode AI
 * Allows connecting external MCP servers to extend LuxCode capabilities
 * Compatible with: Kilo.ai, Cline, GitHub Copilot agent mode, Claude
 */
export class MCPService {
  private servers: Map<string, MCPServer> = new Map();

  // Built-in MCP tools LuxCode exposes to other agents
  static readonly LUXCODE_MCP_TOOLS: MCPTool[] = [
    {
      name: 'generate_web_page',
      description: 'Generate a complete web page (HTML+CSS+JS) from a natural language description',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Natural language description of the web page' },
          subtype: { type: 'string', enum: ['Landing Page', 'Portfolio', 'Dashboard', 'Blog', 'E-commerce', 'Radio/Streaming', 'PWA'], description: 'Type of web page' },
          provider: { type: 'string', enum: ['gemini', 'openai', 'groq', 'ollama', 'lmstudio', 'openrouter'], description: 'AI provider to use' }
        },
        required: ['description']
      }
    },
    {
      name: 'generate_mobile_app',
      description: 'Generate a mobile app project (React Native, Flutter, or Ionic)',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          framework: { type: 'string', enum: ['React Native', 'Flutter', 'Ionic'] }
        },
        required: ['description', 'framework']
      }
    },
    {
      name: 'generate_desktop_app',
      description: 'Generate a desktop app (Tauri, Electron, or Neutralino.js)',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          framework: { type: 'string', enum: ['Tauri', 'Electron', 'Neutralino.js'] }
        },
        required: ['description', 'framework']
      }
    },
    {
      name: 'generate_api',
      description: 'Generate a REST API with Node.js/Express',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          routes: { type: 'array', items: { type: 'string' }, description: 'API routes to generate' }
        },
        required: ['description']
      }
    },
    {
      name: 'edit_code',
      description: 'Edit or improve a code snippet using AI',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          instruction: { type: 'string' }
        },
        required: ['code', 'instruction']
      }
    },
    {
      name: 'fix_bug',
      description: 'Automatically fix a bug in code given the error message',
      inputSchema: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          error: { type: 'string' }
        },
        required: ['code', 'error']
      }
    }
  ];

  async connectServer(name: string, url: string): Promise<void> {
    try {
      const res = await fetch(`${url}/tools/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as any;
      const tools: MCPTool[] = data.result?.tools || [];
      this.servers.set(name, { name, url, tools });
      vscode.window.showInformationMessage(`✅ MCP Server "${name}" conectado con ${tools.length} herramientas`);
    } catch (err: any) {
      vscode.window.showErrorMessage(`❌ No se pudo conectar al servidor MCP "${name}": ${err.message}`);
    }
  }

  async callTool(serverName: string, toolName: string, args: Record<string, any>): Promise<any> {
    const server = this.servers.get(serverName);
    if (!server) throw new Error(`Servidor MCP "${serverName}" no conectado`);
    const res = await fetch(`${server.url}/tools/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: 'tools/call', params: { name: toolName, arguments: args } })
    });
    if (!res.ok) throw new Error(`MCP tool error: HTTP ${res.status}`);
    const data = await res.json() as any;
    return data.result;
  }

  getConnectedServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  // Expose LuxCode as MCP server manifest (for other agents to discover)
  static getServerManifest() {
    return {
      name: 'luxcode-ai',
      version: '0.3.0',
      description: 'LuxCode AI - Generate web, mobile, desktop apps and APIs with AI',
      tools: MCPService.LUXCODE_MCP_TOOLS
    };
  }
}
