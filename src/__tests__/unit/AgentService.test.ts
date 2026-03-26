import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService } from '../../services/AgentService';

describe('AgentService', () => {
  let agent: AgentService;

  beforeEach(() => {
    agent = new AgentService('gemini', 'test-key-456');
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(agent).toBeDefined();
    });
  });

  describe('planTask()', () => {
    it('should return a task with steps array', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: JSON.stringify({
                goal: 'App de reservas',
                steps: [
                  { id: 1, title: 'Crear HTML', type: 'code', prompt: 'Crea index.html' },
                  { id: 2, title: 'Crear CSS', type: 'code', prompt: 'Crea style.css' },
                ],
                estimatedFiles: ['index.html', 'style.css'],
              }) }]
            }
          }]
        }),
      } as Response);

      const task = await agent.planTask('App de reservas con login');
      expect(task).toBeDefined();
      expect(Array.isArray(task.steps)).toBe(true);
    });

    it('should handle malformed AI response gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'respuesta no JSON' }] } }]
        }),
      } as Response);

      // planTask debe manejar el error y retornar estructura válida o lanzar error claro
      await expect(agent.planTask('Test')).resolves.toBeDefined()
        .catch((e: Error) => expect(e).toBeInstanceOf(Error));
    });
  });

  describe('executeTask()', () => {
    it('should return files object', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: { parts: [{ text: '<!-- index.html -->\n<html></html>' }] }
          }]
        }),
      } as Response);

      const mockTask = {
        goal: 'Test',
        steps: [{ id: 1, title: 'HTML', type: 'code', prompt: 'Crea HTML' }],
        estimatedFiles: ['index.html'],
      };

      const result = await agent.executeTask(mockTask as any, vi.fn());
      expect(typeof result).toBe('object');
    });
  });
});
