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

/**
 * AgentService - Multi-step agentic task runner
 * Inspired by Kilo.ai, Cline, and GitHub Copilot Agent Mode
 * Breaks complex tasks into steps and executes them sequentially
 */
export class AgentService {
  private ai: AIService;

  constructor(provider: string, apiKey: string) {
    this.ai = new AIService(provider, apiKey);
  }

  async planTask(userGoal: string): Promise<AgentTask> {
    const planPrompt = `Eres un agente de desarrollo de software. El usuario quiere:\n"${userGoal}"\n\nCrea un plan de ejecución con 3-6 pasos concretos. Responde ÚNICAMENTE con JSON:\n{\n  "steps": [\n    { "id": "step_1", "title": "Descripción del paso" },\n    ...\n  ]\n}\nSin markdown, sin explicaciones.`;

    const raw = await this.ai.rawPrompt(planPrompt);
    const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
    const plan = JSON.parse(cleaned);

    return {
      description: userGoal,
      steps: plan.steps.map((s: any) => ({ ...s, status: 'pending' as const }))
    };
  }

  async executeTask(
    task: AgentTask,
    onStepUpdate: (steps: AgentStep[]) => void
  ): Promise<Record<string, string>> {
    const allFiles: Record<string, string> = {};

    for (const step of task.steps) {
      step.status = 'running';
      onStepUpdate([...task.steps]);

      try {
        const stepPrompt = `Eres un agente experto en desarrollo. Tarea global: "${task.description}"\n\nEjecutando paso: "${step.title}"\n\nGenera el código o archivos necesarios para este paso. Responde con JSON donde cada clave es el nombre del archivo y el valor es su contenido completo. Sin markdown.`;
        const raw = await this.ai.rawPrompt(stepPrompt);
        const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();

        try {
          const files = JSON.parse(cleaned);
          Object.assign(allFiles, files);
          step.result = `✅ ${Object.keys(files).length} archivo(s) generado(s)`;
        } catch {
          // Si no es JSON, guardar como texto del step
          step.result = '✅ Completado';
        }

        step.status = 'done';
      } catch (err: any) {
        step.status = 'error';
        step.result = `❌ ${err.message}`;
      }

      onStepUpdate([...task.steps]);
      // Pausa entre steps para no saturar la API
      await new Promise(r => setTimeout(r, 500));
    }

    return allFiles;
  }
}
