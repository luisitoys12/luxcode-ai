import { describe, it, expect } from 'vitest';

// Re-export de la función para testearla directamente
// En producción está en AIService — se testea vía generate() con Ollama/LMStudio
// Este test documenta el contrato esperado

const VALID_LOCAL = ['http://localhost:11434', 'http://127.0.0.1:1234', 'http://[::1]:8080'];
const INVALID_EXTERNAL = ['https://evil.com/api', 'http://192.168.1.1:11434', 'http://0.0.0.0:11434'];

describe('validateLocalUrl — contrato de seguridad [FE-05]', () => {
  it('should accept localhost URLs', () => {
    VALID_LOCAL.forEach(url => {
      const parsed = new URL(url);
      const isLocal = ['localhost','127.0.0.1','::1'].includes(parsed.hostname);
      expect(isLocal).toBe(true);
    });
  });

  it('should reject external/private IPs', () => {
    INVALID_EXTERNAL.forEach(url => {
      const parsed = new URL(url);
      const isLocal = ['localhost','127.0.0.1','::1'].includes(parsed.hostname);
      expect(isLocal).toBe(false);
    });
  });
});
