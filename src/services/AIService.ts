export class AIService {
  constructor(private provider: string, private apiKey: string) {}

  async generate(type: 'web' | 'mobile' | 'desktop', subtype: string, description: string): Promise<Record<string, string>> {
    const prompt = this.buildPrompt(type, subtype, description);
    const raw = await this.callAI(prompt);
    return this.parseFiles(raw);
  }

  async editCode(code: string, instruction: string): Promise<string> {
    const prompt = `Eres un experto desarrollador. Modifica el siguiente código según la instrucción.\n\nINSTRUCCIÓN: ${instruction}\n\nCÓDIGO:\n${code}\n\nResponde ÚNICAMENTE con el código modificado, sin markdown ni explicaciones.`;
    return this.callAI(prompt);
  }

  async explainCode(code: string): Promise<string> {
    const prompt = `Explica el siguiente código de forma clara y detallada en español. Usa formato Markdown con secciones:\n\n\`\`\`\n${code}\n\`\`\``;
    return this.callAI(prompt);
  }

  async fixBug(code: string, error: string): Promise<string> {
    const prompt = `Eres un experto en debugging. Corrige el bug en este código.\n\nERROR: ${error}\n\nCÓDIGO:\n${code}\n\nResponde ÚNICAMENTE con el código corregido, sin explicaciones.`;
    return this.callAI(prompt);
  }

  private buildPrompt(type: string, subtype: string, description: string): string {
    const templates: Record<string, string> = {
      web: `Eres un experto en desarrollo web moderno. Genera un proyecto "${subtype}" completo basado en:\n"${description}"\n\nResponde ÚNICAMENTE con JSON en este formato exacto (sin markdown):\n{\n  "index.html": "<HTML completo>",\n  "style.css": "<CSS moderno, variables, responsive>",\n  "script.js": "<JavaScript funcional>"\n}\nRequisitos: HTML5 semántico, CSS con variables/flexbox/grid, JS vanilla, diseño profesional oscuro/claro.`,

      mobile: `Eres un experto en desarrollo móvil. Genera la estructura base de una app "${subtype}" para:\n"${description}"\n\nResponde ÚNICAMENTE con JSON (sin markdown) donde cada clave es el nombre del archivo y el valor su contenido completo. Incluye: pantalla principal, navegación, estilos, y README de instalación.`,

      desktop: `Eres un experto en apps de escritorio. Genera la estructura base de una app "${subtype}" para:\n"${description}"\n\nResponde ÚNICAMENTE con JSON (sin markdown) donde cada clave es el nombre del archivo y el valor su contenido completo. Incluye: ventana principal, menú, estilos, package.json/Cargo.toml según framework, y README.`
    };
    return templates[type];
  }

  private async callAI(prompt: string): Promise<string> {
    switch (this.provider) {
      case 'gemini': return this.callGemini(prompt);
      case 'openai': return this.callOpenAI(prompt, 'gpt-4o');
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
    if (!res.ok) { const e = await res.json() as any; throw new Error(`Gemini: ${e.error?.message}`); }
    const d = await res.json() as any;
    return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAI(prompt: string, model = 'gpt-4o'): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 })
    });
    if (!res.ok) { const e = await res.json() as any; throw new Error(`OpenAI: ${e.error?.message}`); }
    const d = await res.json() as any;
    return d.choices?.[0]?.message?.content || '';
  }

  private async callGroq(prompt: string): Promise<string> {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 })
    });
    if (!res.ok) { const e = await res.json() as any; throw new Error(`Groq: ${e.error?.message}`); }
    const d = await res.json() as any;
    return d.choices?.[0]?.message?.content || '';
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const config = { openrouterModel: 'deepseek/deepseek-coder' };
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': 'https://luisitoys12.github.io/luxcode-ai',
        'X-Title': 'LuxCode AI'
      },
      body: JSON.stringify({ model: config.openrouterModel, messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
    });
    if (!res.ok) { const e = await res.json() as any; throw new Error(`OpenRouter: ${e.error?.message}`); }
    const d = await res.json() as any;
    return d.choices?.[0]?.message?.content || '';
  }

  private async callOllama(prompt: string): Promise<string> {
    const { workspace } = await import('vscode');
    const config = workspace.getConfiguration('luxcode');
    const url = config.get<string>('ollamaUrl', 'http://localhost:11434');
    const model = config.get<string>('ollamaModel', 'llama3');
    const res = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt, stream: false })
    });
    if (!res.ok) throw new Error(`Ollama: ${res.statusText}`);
    const d = await res.json() as any;
    return d.response || '';
  }

  private async callLMStudio(prompt: string): Promise<string> {
    const { workspace } = await import('vscode');
    const config = workspace.getConfiguration('luxcode');
    const url = config.get<string>('lmstudioUrl', 'http://localhost:1234');
    const res = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 })
    });
    if (!res.ok) throw new Error(`LM Studio: ${res.statusText}`);
    const d = await res.json() as any;
    return d.choices?.[0]?.message?.content || '';
  }

  private parseFiles(raw: string): Record<string, string> {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(cleaned); }
    catch { return { 'index.html': raw }; }
  }
}
