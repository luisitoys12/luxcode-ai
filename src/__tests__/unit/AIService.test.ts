import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../services/AIService';
import { promptFixture, responseFixture, apiKeyFixture } from '../../__fixtures__/ai.fixture';

// Helper: mock fetch con respuesta JSON
function mockFetch(body: unknown, status = 200) {
  (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response);
}

describe('AIService — generate()', () => {
  let service: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIService('gemini', apiKeyFixture.gemini);
  });

  it('should return parsed files when Gemini responds with valid JSON', async () => {
    mockFetch(responseFixture.gemini.ok);
    const result = await service.generate('web', 'landing', promptFixture.simple);
    expect(result).toHaveProperty('index.html');
    expect(typeof result['index.html']).toBe('string');
  });

  it('should throw when Gemini returns HTTP 400', async () => {
    mockFetch(responseFixture.gemini.error, 400);
    await expect(service.generate('web', 'landing', promptFixture.simple))
      .rejects.toThrow('Gemini:');
  });

  it('should throw without exposing API key in error message', async () => {
    mockFetch(responseFixture.gemini.error, 401);
    try {
      await service.generate('web', 'landing', promptFixture.simple);
    } catch (e: any) {
      expect(e.message).not.toContain(apiKeyFixture.gemini);
    }
  });

  it('should inject REACT_NEXTJS_RULES when subtype contains "next"', async () => {
    mockFetch(responseFixture.gemini.ok);
    // Verificar que el prompt generado contiene las reglas del skill
    const spy = vi.spyOn(service as any, 'callAI');
    await service.generate('web', 'nextjs-dashboard', promptFixture.nextjs).catch(() => {});
    const calledPrompt = spy.mock.calls[0]?.[0] as string;
    expect(calledPrompt).toContain('useActionState');
    expect(calledPrompt).toContain("'use cache'");
    expect(calledPrompt).toContain('next/image');
  });

  it('should inject BACKEND_TESTING_RULES when type contains "api"', async () => {
    mockFetch(responseFixture.gemini.ok);
    const spy = vi.spyOn(service as any, 'callAI');
    await service.generate('api', 'rest', promptFixture.api).catch(() => {});
    const calledPrompt = spy.mock.calls[0]?.[0] as string;
    expect(calledPrompt).toContain('vitest.config.ts');
    expect(calledPrompt).toContain('coverage');
  });
});

describe('AIService — editCode()', () => {
  let service: AIService;
  beforeEach(() => { vi.clearAllMocks(); service = new AIService('openai', apiKeyFixture.openai); });

  it('should return modified code when OpenAI responds correctly', async () => {
    mockFetch(responseFixture.openai.ok);
    const result = await service.editCode('const x = 1;', 'rename x to y');
    expect(typeof result).toBe('string');
  });

  it('should throw when OpenAI returns HTTP 401', async () => {
    mockFetch(responseFixture.openai.error, 401);
    await expect(service.editCode('const x = 1;', 'rename')).rejects.toThrow('OpenAI:');
  });
});

describe('AIService — fixBug()', () => {
  let service: AIService;
  beforeEach(() => { vi.clearAllMocks(); service = new AIService('groq', apiKeyFixture.groq); });

  it('should return fixed code when Groq responds correctly', async () => {
    mockFetch(responseFixture.groq.ok);
    const result = await service.fixBug('const x = undefinedd;', 'ReferenceError: undefinedd');
    expect(typeof result).toBe('string');
  });

  it('should throw when Groq returns HTTP 429 (rate limit)', async () => {
    mockFetch({ error: { message: 'Rate limit exceeded' } }, 429);
    await expect(service.fixBug('code', 'error')).rejects.toThrow('Groq:');
  });
});

describe('AIService — generateAPI()', () => {
  let service: AIService;
  beforeEach(() => { vi.clearAllMocks(); service = new AIService('openrouter', apiKeyFixture.openrouter); });

  it('should return files including server.js when OpenRouter responds', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({
        choices: [{ message: { content: '{"server.js":"const express = require(express)","package.json":"{}"}' } }],
      }),
    } as Response);
    const result = await service.generateAPI('e-commerce', ['GET /products', 'POST /orders']);
    expect(result).toHaveProperty('server.js');
  });

  it('should use CRUD completo when no routes are provided', async () => {
    const spy = vi.spyOn(service as any, 'callAI').mockResolvedValue('{"server.js":"..."}');
    await service.generateAPI('blog', []);
    expect(spy.mock.calls[0][0]).toContain('CRUD completo');
  });
});

describe('AIService — parseFiles() edge cases', () => {
  let service: AIService;
  beforeEach(() => { vi.clearAllMocks(); service = new AIService('gemini', apiKeyFixture.gemini); });

  it('should fallback to index.html key when AI returns non-JSON', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'este no es json válido' }] } }],
      }),
    } as Response);
    const result = await service.generate('web', 'landing', 'test');
    expect(result).toHaveProperty('index.html');
  });

  it('should strip markdown code fences before parsing', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true, status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '```json\n{"index.html":"<html>"}\n```' }] } }],
      }),
    } as Response);
    const result = await service.generate('web', 'landing', 'test');
    expect(result['index.html']).toBe('<html>');
  });
});

describe('AIService — timeout handling', () => {
  let service: AIService;
  beforeEach(() => { vi.clearAllMocks(); service = new AIService('gemini', apiKeyFixture.gemini); });

  it('should throw timeout error when fetch is aborted', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
    );
    await expect(service.generate('web', 'landing', 'test'))
      .rejects.toThrow('timeout');
  });
});

describe('AIService — proveedor no soportado', () => {
  it('should throw for unknown provider', async () => {
    const service = new AIService('unknown-provider', 'fake-key');
    await expect(service.generate('web', 'landing', 'test'))
      .rejects.toThrow('Proveedor no soportado');
  });
});
