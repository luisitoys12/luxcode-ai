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
      expect(new AIService('groq', 'groq-key')).toBeDefined();
    });

    it('should create instance with ollama provider', () => {
      expect(new AIService('ollama', 'local')).toBeDefined();
    });
  });

  describe('generate()', () => {
    it('should return files object on success', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"index.html":"<html></html>"}' }] } }]
        }),
      } as Response);
      const result = await ai.generate('web', 'Landing Page', 'Radio streaming');
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    it('should fallback to index.html key on non-JSON response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '<html><body>Radio</body></html>' }] } }]
        }),
      } as Response);
      const result = await ai.generate('web', 'Radio', 'Estación');
      expect(Object.keys(result).length).toBeGreaterThanOrEqual(1);
    });

    it('should throw on network error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'));
      await expect(ai.generate('web', 'LP', 'Test')).rejects.toThrow();
    });

    it('should throw on 401 response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false, status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } }),
      } as Response);
      await expect(ai.generate('web', 'Portfolio', 'Test')).rejects.toThrow();
    });

    it('should use react-nextjs rules for nextjs subtype', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"app/page.tsx":"export default function Page(){}"}' }] } }]
        }),
      } as Response);
      const result = await ai.generate('web', 'nextjs', 'Blog');
      expect(result).toBeDefined();
    });
  });

  describe('generateAPI()', () => {
    it('should call AI and return files object', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"server.js":"const express = require(\'express\');"}' }] } }]
        }),
      } as Response);
      const result = await ai.generateAPI('API de blog', ['GET /posts']);
      expect(result).toBeDefined();
    });

    it('should work with empty routes array', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"server.js":"// api"}' }] } }]
        }),
      } as Response);
      const result = await ai.generateAPI('Simple API', []);
      expect(result).toBeDefined();
    });
  });

  describe('editCode()', () => {
    it('should return edited code string', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'const x = 1;' }] } }]
        }),
      } as Response);
      const result = await ai.editCode('var x = 1', 'usa const');
      expect(typeof result).toBe('string');
    });
  });

  describe('explainCode()', () => {
    it('should return explanation string', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Esta función hace X...' }] } }]
        }),
      } as Response);
      const result = await ai.explainCode('const x = () => {}');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('fixBug()', () => {
    it('should return fixed code string', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'const fixed = true;' }] } }]
        }),
      } as Response);
      const result = await ai.fixBug('const broken =', 'SyntaxError');
      expect(typeof result).toBe('string');
    });
  });
});
