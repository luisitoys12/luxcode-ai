import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgentService, AgentTask, AgentStep } from '../../services/AgentService';

describe('AgentService', () => {
  let agent: AgentService;

  beforeEach(() => {
    agent = new AgentService('gemini', 'test-key');
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create instance', () => {
      expect(agent).toBeDefined();
    });
  });

  describe('planTask()', () => {
    it('should return AgentTask with steps array', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: JSON.stringify({
            steps: [
              { id: 'step_1', title: 'Crear HTML' },
              { id: 'step_2', title: 'Crear CSS' },
            ]
          }) }] } }]
        }),
      } as Response);

      const task = await agent.planTask('App de reservas');
      expect(task).toBeDefined();
      expect(task.description).toBe('App de reservas');
      expect(Array.isArray(task.steps)).toBe(true);
      expect(task.steps.length).toBeGreaterThan(0);
      expect(task.steps[0].status).toBe('pending');
    });

    it('should fallback to single step on malformed JSON', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'respuesta no JSON' }] } }]
        }),
      } as Response);

      const task = await agent.planTask('Test');
      expect(task.steps.length).toBe(1);
      expect(task.steps[0].id).toBe('step_1');
    });
  });

  describe('executeTask()', () => {
    it('should call onStepUpdate and return files object', async () => {
      // Firma real: executeTask(task: AgentTask, onStepUpdate: (steps: AgentStep[]) => void)
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '{"index.html":"<html></html>"}' }] } }]
        }),
      } as Response);

      const mockTask: AgentTask = {
        description: 'Test app',
        steps: [
          { id: 'step_1', title: 'Crear HTML', status: 'pending' },
        ] as AgentStep[],
      };

      const onUpdate = vi.fn();
      const result = await agent.executeTask(mockTask, onUpdate);

      expect(typeof result).toBe('object');
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should mark step as error on AI failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('AI down'));

      const mockTask: AgentTask = {
        description: 'Fail test',
        steps: [{ id: 'step_1', title: 'Step fallido', status: 'pending' }] as AgentStep[],
      };

      const result = await agent.executeTask(mockTask, vi.fn());
      expect(mockTask.steps[0].status).toBe('error');
      expect(typeof result).toBe('object');
    });
  });
});
