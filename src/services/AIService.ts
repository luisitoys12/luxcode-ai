export class AIService {
  private provider: string;
  private apiKey: string;

  constructor(provider: string, apiKey: string) {
    this.provider = provider;
    this.apiKey = apiKey;
  }

  async generateWebPage(description: string): Promise<{ html: string; css: string; js: string }> {
    const prompt = `Eres un experto desarrollador web. Crea una página web completa y moderna basada en esta descripción:

"${description}"

Respóndeme ÚNICAMENTE con JSON en este formato exacto, sin markdown ni explicaciones:
{
  "html": "<el HTML completo aquí>",
  "css": "<el CSS completo aquí>",
  "js": "<el JavaScript completo aquí>"
}

Requisitos:
- HTML5 semántico y accesible
- CSS moderno con variables, flexbox/grid, responsive
- JavaScript vanilla funcional
- Diseño atractivo y profesional
- Paleta de colores coherente`;

    const raw = this.provider === 'gemini'
      ? await this.callGemini(prompt)
      : await this.callOpenAI(prompt);

    return this.parseJSON(raw);
  }

  async editCode(code: string, instruction: string): Promise<string> {
    const prompt = `Eres un experto desarrollador web. Modifica el siguiente código según la instrucción dada.

INSTRUCCIÓN: ${instruction}

CÓDIGO ORIGINAL:
${code}

Responde ÚNICAMENTE con el código modificado, sin explicaciones ni markdown.`;

    return this.provider === 'gemini'
      ? await this.callGemini(prompt)
      : await this.callOpenAI(prompt);
  }

  private async callGemini(prompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(`Gemini API Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json() as any;
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const url = 'https://api.openai.com/v1/chat/completions';
    const body = {
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 8192
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const err = await res.json() as any;
      throw new Error(`OpenAI API Error: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json() as any;
    return data.choices?.[0]?.message?.content || '';
  }

  private parseJSON(raw: string): { html: string; css: string; js: string } {
    // Limpiar posible markdown
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      // Si falla el parse, devolver el raw como HTML
      return { html: raw, css: '', js: '' };
    }
  }
}
