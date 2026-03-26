import * as vscode from 'vscode';

// Timeout global para todos los fetch (30s)
const FETCH_TIMEOUT_MS = 30_000;

function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

// [FE-05] Validar que la URL sea localhost
function validateLocalUrl(url: string, provider: string): void {
  try {
    const parsed = new URL(url);
    const isLocal = ['localhost','127.0.0.1','::1'].includes(parsed.hostname);
    if (!isLocal) { throw new Error(`${provider}: URL debe ser localhost, no "${parsed.hostname}"`); }
  } catch (e: any) {
    if (e.message.includes(provider)) { throw e; }
    throw new Error(`${provider}: URL inválida`);
  }
}

// =============================================================================
// [Opción C] buildPrompt mejorado con react-nextjs, frontend-design y backend-testing skills
// Cada tipo de proyecto inyecta las reglas del skill correspondiente al prompt
// =============================================================================

const REACT_NEXTJS_RULES = `
REGLAS OBLIGATORIAS React 19 + Next.js 16 (skill: react-nextjs):
- Server Components por default. 'use client' SOLO para onClick/useState/browser APIs
- Forms: useActionState + useFormStatus (NO useState para forms)
- Mutations: useOptimistic para feedback inmediato
- Data fetching: 'use cache' + cacheLife() en Server Components
- Imágenes: next/image con priority en elementos above-the-fold
- Lazy loading: dynamic() con skeleton de carga
- Estado global: Zustand. Estado servidor: TanStack Query. URL state: nuqs
- Validación: Zod en Server Actions
- PROHIBIDO: any, useEffect innecesario, fetch en Client Components sin TanStack Query
`.trim();

const FRONTEND_DESIGN_RULES = `
REGLAS OBLIGATORIAS de diseño UI (skill: frontend-design):
- CSS custom properties para todos los colores, espaciados y tipografía (no valores hardcoded)
- Contraste WCAG AA mínimo 4.5:1 para texto normal
- Mobile-first: columna única base, expandir con min-width media queries
- Botones: hover brightness(1.15) + transform translateY(-1px), disabled opacity 0.45
- Inputs: focus outline 2px solid var(--color-primary)
- Animaciones: SOLO transform y opacity (no width/height/top/left)
- @media (prefers-reduced-motion: reduce) en todas las animaciones
- aria-label en iconos sin texto visible
- aria-live="polite" en mensajes dinámicos
- Skeleton shimmer en estados de carga (no solo spinner)
`.trim();

const BACKEND_TESTING_RULES = `
REGLAS OBLIGATORIAS de calidad backend (skill: backend-testing):
- Incluir vitest.config.ts con coverage thresholds (80% statements, 70% branches)
- Un archivo __tests__/integration/<recurso>.test.ts por cada endpoint generado
- Cada test cubre: happy path + error 400 + error 401/403 + error 404
- Fixtures en src/__fixtures__/ (no datos inline en tests)
- Mock de servicios externos con vi.mock()
- Nombres: it('should <accion> when <condicion>')
`.trim();

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
    return this.callAI(`Modifica el siguiente código según la instrucción.\nINSTRUCCIÓN: ${instruction}\nCÓDIGO:\n${code}\nResponde SOLO con el código modificado, sin markdown.`);
  }

  async explainCode(code: string): Promise<string> {
    return this.callAI(`Explica el siguiente código en español con formato Markdown:\n\`\`\`\n${code}\n\`\`\``);
  }

  async fixBug(code: string, error: string): Promise<string> {
    return this.callAI(`Corrige el bug.\nERROR: ${error}\nCÓDIGO:\n${code}\nResponde SOLO con el código corregido.`);
  }

  async generateAPI(description: string, routes: string[]): Promise<Record<string, string>> {
    const routeList = routes.length ? routes.join(', ') : 'CRUD completo';
    const prompt = [
      `Genera una API REST completa con Node.js/Express para: "${description}"`,
      `Rutas: ${routeList}`,
      BACKEND_TESTING_RULES,
      `Responde SOLO con JSON (sin markdown): {"server.js":"...","package.json":"...","vitest.config.ts":"...",".env.example":"...","src/__tests__/integration/api.test.ts":"...","README.md":"..."}`,
    ].join('\n');
    const raw = await this.callAI(prompt);
    return this.parseFiles(raw);
  }

  // [Opción C] buildPrompt inyecta las reglas del skill según el tipo de proyecto
  private buildPrompt(type: string, subtype: string, description: string): string {
    const lines: string[] = [
      `Eres experto en desarrollo ${type}. Genera un proyecto "${subtype}" completo y production-ready para: "${description}".`,
    ];

    // Inyectar skill react-nextjs en proyectos web con React/Next
    const isReact = /next|react|nextjs/i.test(subtype);
    const isWeb   = /web|frontend/i.test(type);
    const isAPI   = /api|backend|server|express/i.test(type + subtype);

    if (isReact) {
      lines.push(REACT_NEXTJS_RULES);
      lines.push(FRONTEND_DESIGN_RULES);
      lines.push(`Responde SOLO con JSON válido (sin markdown): {"app/page.tsx":"...","app/layout.tsx":"...","components/ui/Button.tsx":"...","lib/utils.ts":"...","package.json":"...","tailwind.config.ts":"...","README.md":"..."}`);
    } else if (isWeb) {
      lines.push(FRONTEND_DESIGN_RULES);
      lines.push(`Responde SOLO con JSON válido (sin markdown): {"index.html":"...","style.css":"...","script.js":"..."}`);
    } else if (isAPI) {
      lines.push(BACKEND_TESTING_RULES);
      lines.push(`Responde SOLO con JSON válido (sin markdown): {"server.js":"...","package.json":"...","vitest.config.ts":"...",".env.example":"...","src/__tests__/integration/api.test.ts":"...","README.md":"..."}`);
    } else {
      lines.push(`Responde SOLO con JSON válido (sin markdown, sin texto extra): {"index.html":"...","style.css":"...","script.js":"..."}`);
    }

    lines.push('CSS moderno con variables CSS, diseño oscuro profesional, totalmente responsive.');
    return lines.join('\n');
  }

  private async callAI(prompt: string): Promise<string> {
    switch (this.provider) {
      case 'gemini':     return this.callGemini(prompt);
      case 'openai':     return this.callOpenAI(prompt);
      case 'groq':       return this.callGroq(prompt);
      case 'openrouter': return this.callOpenRouter(prompt);
      case 'ollama':     return this.callOllama(prompt);
      case 'lmstudio':   return this.callLMStudio(prompt);
      default: throw new Error(`Proveedor no soportado: ${this.provider}`);
    }
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    try {
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 8192 } })
      });
      if (!res.ok) { const e: any = await res.json(); throw new Error(`Gemini: ${e.error?.message || `HTTP ${res.status}`}`); }
      const d: any = await res.json();
      return d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e: any) {
      if (e.name === 'AbortError') { throw new Error('Gemini: timeout después de 30s'); }
      throw e;
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const res = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
      });
      if (!res.ok) { const e: any = await res.json(); throw new Error(`OpenAI: ${e.error?.message || `HTTP ${res.status}`}`); }
      const d: any = await res.json();
      return d.choices?.[0]?.message?.content || '';
    } catch (e: any) {
      if (e.name === 'AbortError') { throw new Error('OpenAI: timeout después de 30s'); }
      throw e;
    }
  }

  private async callGroq(prompt: string): Promise<string> {
    try {
      const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
      });
      if (!res.ok) { const e: any = await res.json(); throw new Error(`Groq: ${e.error?.message || `HTTP ${res.status}`}`); }
      const d: any = await res.json();
      return d.choices?.[0]?.message?.content || '';
    } catch (e: any) {
      if (e.name === 'AbortError') { throw new Error('Groq: timeout después de 30s'); }
      throw e;
    }
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    try {
      const res = await fetchWithTimeout('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}`, 'HTTP-Referer': 'https://luisitoys12.github.io/luxcode-ai', 'X-Title': 'LuxCode AI' },
        body: JSON.stringify({ model: 'deepseek/deepseek-coder', messages: [{ role: 'user', content: prompt }], max_tokens: 8192 })
      });
      if (!res.ok) { const e: any = await res.json(); throw new Error(`OpenRouter: ${e.error?.message || `HTTP ${res.status}`}`); }
      const d: any = await res.json();
      return d.choices?.[0]?.message?.content || '';
    } catch (e: any) {
      if (e.name === 'AbortError') { throw new Error('OpenRouter: timeout después de 30s'); }
      throw e;
    }
  }

  private async callOllama(prompt: string): Promise<string> {
    const cfg = vscode.workspace.getConfiguration('luxcode');
    const url = cfg.get<string>('ollamaUrl', 'http://localhost:11434');
    const model = cfg.get<string>('ollamaModel', 'llama3');
    validateLocalUrl(url, 'Ollama');
    try {
      const res = await fetchWithTimeout(`${url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt, stream: false })
      });
      if (!res.ok) { throw new Error(`Ollama: HTTP ${res.status}`); }
      const d: any = await res.json();
      return d.response || '';
    } catch (e: any) {
      if (e.name === 'AbortError') { throw new Error('Ollama: timeout después de 30s. ¿Está corriendo Ollama?'); }
      throw e;
    }
  }

  private async callLMStudio(prompt: string): Promise<string> {
    const cfg = vscode.workspace.getConfiguration('luxcode');
    const url = cfg.get<string>('lmstudioUrl', 'http://localhost:1234');
    validateLocalUrl(url, 'LM Studio');
    try {
      const res = await fetchWithTimeout(`${url}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], temperature: 0.7, max_tokens: 8192 })
      });
      if (!res.ok) { throw new Error(`LM Studio: HTTP ${res.status}`); }
      const d: any = await res.json();
      return d.choices?.[0]?.message?.content || '';
    } catch (e: any) {
      if (e.name === 'AbortError') { throw new Error('LM Studio: timeout después de 30s. ¿Está corriendo LM Studio?'); }
      throw e;
    }
  }

  private parseFiles(raw: string): Record<string, string> {
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try { return JSON.parse(cleaned); }
    catch { return { 'index.html': raw }; }
  }
}
