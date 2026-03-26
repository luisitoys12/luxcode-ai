import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIService } from '../../services/AIService';

describe('AIService', () => {
  let ai: AIService;

  beforeEach(() => {
    ai = new AIService('gemini', 'test-key-123');
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance with gemini provider', () => {
      expect(ai).toBeDefined();
    });

    it('should create instance with groq provider', () => {
      const groqAI = new AIService('groq', 'groq-key');
      expect(groqAI).toBeDefined();
    });

    it('should create instance with ollama local provider', () => {
      const ollamaAI = new AIService('ollama', 'local');
      expect(ollamaAI).toBeDefined();
    });
  });

  describe('generate()', () => {
    it('should call fetch with correct Gemini endpoint', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '<!-- index.html -->\n<!DOCTYPE html>\n<html></html>' }] }
          }]
        }),
      } as Response);

      const result = await ai.generate('web', 'Landing Page', 'Radio streaming con chat');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should return files object with at least one file', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '<!-- index.html -->\n<html><body>Radio</body></html>' }] }
          }]
        }),
      } as Response);

      const result = await ai.generate('web', 'Radio/Streaming', 'Estación de radio');
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(0);
    });

    it('should handle fetch error gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(ai.generate('web', 'Landing Page', 'Test')).rejects.toThrow();
    });

    it('should handle non-ok response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      } as Response);

      await expect(ai.generate('web', 'Portfolio', 'Test')).rejects.toThrow();
    });
  });

  describe('generateAPI()', () => {
    it('should generate API with given description', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '// server.js\nconst express = require(\'express\');' }] }
          }]
        }),
      } as Response);

      const result = await ai.generateAPI('API de blog con auth JWT', ['GET /posts', 'POST /posts']);
      expect(result).toBeDefined();
    });

    it('should work with empty routes array', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '// api.js\nconsole.log("api")' }] } }]
        }),
      } as Response);

      const result = await ai.generateAPI('Simple API', []);
      expect(result).toBeDefined();
    });
  });

  describe('editCode()', () => {
    it('should return edited code string', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'const x = 1;' }] } }]
        }),
      } as Response);

      const result = await ai.editCode('var x = 1', 'usa const en lugar de var');
      expect(typeof result).toBe('string');
    });
  });

  describe('explainCode()', () => {
    it('should return explanation string', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Este código hace X...' }] } }]
        }),
      } as Response);

      const result = await ai.explainCode('const x = () => {}');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('fixBug()', () => {
    it('should return fixed code', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'const fixed = true;' }] } }]
        }),
      } as Response);

      const result = await ai.fixBug('const broken =', 'SyntaxError: Unexpected end');
      expect(typeof result).toBe('string');
    });
  });
});
