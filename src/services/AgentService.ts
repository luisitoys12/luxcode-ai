import * as vscode from 'vscode';
import { AIService } from './AIService';
import { FileService } from './FileService';

export interface AgentStep {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'done' | 'error';
  result?: string;
}

export interface AgentTask {
  description: string;
  steps: AgentStep[];
}

export class AgentService {
  private ai: AIService;

  constructor(provider: string, apiKey: string) {
    this.ai = new AIService(provider, apiKey);
  }

  async planTask(userGoal: string): Promise<AgentTask> {
    const planPrompt = `Eres un agente de desarrollo. El usuario quiere: "${userGoal}"\nCrea un plan con 3-6 pasos. Responde SOLO con JSON v\u00e1lido:\n{"steps":[{"id":"step_1","title":"descripcion"}]}`;
    const raw = await this.ai.rawPrompt(planPrompt);
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      const plan = JSON.parse(cleaned);
      return { description: userGoal, steps: plan.steps.map((s: any) => ({ ...s, status: 'pending' as const })) };
    } catch {
      return { description: userGoal, steps: [{ id: 'step_1', title: 'Generar proyecto completo', status: 'pending' }] };
    }
  }

  async executeTask(task: AgentTask, onStepUpdate: (steps: AgentStep[]) => void): Promise<Record<string, string>> {
    const allFiles: Record<string, string> = {};
    for (const step of task.steps) {
      step.status = 'running';
      onStepUpdate([...task.steps]);
      try {
        const stepPrompt = `Tarea: "${task.description}"\nPaso actual: "${step.title}"\nGenera los archivos necesarios. Responde SOLO con JSON: {"filename.ext":"contenido"}`;
        const raw = await this.ai.rawPrompt(stepPrompt);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
        try { Object.assign(allFiles, JSON.parse(cleaned)); } catch { /* skip */ }
        step.status = 'done';
        step.result = '\u2705 Completado';
      } catch (err: any) {
        step.status = 'error';
        step.result = `\u274c ${err.message}`;
      }
      onStepUpdate([...task.steps]);
      await new Promise(r => setTimeout(r, 400));
    }
    return allFiles;
  }
}
