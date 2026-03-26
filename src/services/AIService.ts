import * as vscode from 'vscode';

export class AIService {
  constructor(private provider: string, private apiKey: string) {}

  async rawPrompt(prompt: string): Promise<string> {
    return this.callAI(prompt);
  }

  async generate(type: string, subtype: string, description: string): Promise<Record<string, string>> {
    const prompt = this.buildPrompt(type, subtype, description);
    const raw = await this.callAI(prompt);
    return this.parseFiles(raw);
  }

  async editCode(code: string, instruction: string): Promise<string> {
    return this.callAI(`Modifica el siguiente c\u00f3digo seg\u00fan la instrucci\u00f3n.\nINSTRUCCI\u00d3N: ${instruction}\nC\u00d3DIGO:\n${code}\nResponde SOLO con el c\u00f3digo modificado, sin markdown.`);
  }

  async explainCode(code: string): Promise<string> {
    return this.callAI(`Explica el siguiente c\u00f3digo en espa\u00f1ol con formato Markdown:\n\`\`\`\n${code}\n\`\`\``);
  }

  async fixBug(code: string, error: string): Promise<string> {
    return this.callAI(`Corrige el bug.\nERROR: ${error}\nC\u00d3DIGO:\n${code}\nResponde SOLO con el c\u00f3digo corregido.`);
  }

  async generateAPI(description: string, routes: string[]): Promise<Record<string, string>> {
    const routeList = routes.length ? routes.join(', ') : 'CRUD completo';
    const prompt = `Genera una API REST completa con Node.js/Express para:\n"${description}"\nRutas: ${routeList}\nResponde SOLO con JSON (sin markdown): {"server.js":"...","package.json":"...",".env.example":"...","README.md":"..."}`;
    const raw = await this.callAI(prompt);
    return this.parseFiles(raw);
  }

  private buildPrompt(type: string, subtype: string, description: string): string {
    const base = `Eres experto en desarrollo ${type}. Genera un proyecto "${subtype}" completo para: "${description}".`;
    const format = `Responde SOLO con JSON v\u00e1lido (sin markdown, sin texto extra): {"index.html":"...","style.css":"...","script.js":"..."}`;
    return `${base}\n${format}\nCSS moderno con variables, dise\u00f1o oscuro profesional, responsive.`;
  }

  private async callAI(prompt: string): Promise<string> {
    switch (this.provider) {
      case 'gemini': return this.callGemini(prompt);
      case 'openai': return this.callOpenAI(prompt);
      case 'groq': return this.callGroq(prompt);
      case 'openrouter': return this.callOpenRouter(prompt);
      case 'ollama': return this.callOllama(prompt);
      case 'lmstudio': return this.callLMStudio(prompt);
      default: throw new Error(`Proveedor no soportado: ${this.provider}`);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } })
    });
    if (!res.ok) { const e: any = await res.json(); throw new Error(`Gemini: ${e.error?.message}`); }
    const d: any = await res.json();
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
    });
    if (!res.ok) { const e: any = await res.json(); throw new Error(`OpenAI: ${e.error?.message}`); }
    const d: any = await res.json();
    return d.choices?.[0]?.message?.content || '';
  }

  private async callGroq(prompt: string): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
    });
    if (!res.ok) { const e: any = await res.json(); throw new Error(`Groq: ${e.error?.message}`); }
    const d: any = await res.json();
    return d.choices?.[0]?.message?.content || '';
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'HTTP-Referer': 'https://luisitoys12.github.io/luxcode-ai', 'X-Title': 'LuxCode AI' },
      body: JSON.stringify({ model: 'deepseek/deepseek-coder', messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
    });
    if (!res.ok) { const e: any = await res.json(); throw new Error(`OpenRouter: ${e.error?.message}`); }
    const d: any = await res.json();
    return d.choices?.[0]?.message?.content || '';
  }

  private async callOllama(prompt: string): Promise<string> {
    const cfg = vscode.workspace.getConfiguration('luxcode');
    const url = cfg.get<string>('ollamaUrl', 'http://localhost:11434');
    const model = cfg.get<string>('ollamaModel', 'llama3');
    const res = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    });
    if (!res.ok) { throw new Error(`Ollama: ${res.statusText}`); }
    const d: any = await res.json();
    return d.response || '';
  }

  private async callLMStudio(prompt: string): Promise<string> {
    const cfg = vscode.workspace.getConfiguration('luxcode');
    const url = cfg.get<string>('lmstudioUrl', 'http://localhost:1234');
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 })
    });
    if (!res.ok) { throw new Error(`LM Studio: ${res.statusText}`); }
    const d: any = await res.json();
    return d.choices?.[0]?.message?.content || '';
  }

  private parseFiles(raw: string): Record<string, string> {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(cleaned); }
    catch { return { 'index.html': raw }; }
  }
}
