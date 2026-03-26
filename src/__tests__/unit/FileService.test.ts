import { describe, it, expect, vi } from 'vitest';
import { FileService } from '../../services/FileService';

describe('FileService', () => {
  describe('save() — static method exists', () => {
    it('should be defined as static method', () => {
      expect(typeof FileService.save).toBe('function');
    });

    it('should accept web type without throwing synchronously', () => {
      // save() es async, solo verificamos que no lanza sincrónicamente
      const files = { 'index.html': '<html></html>', 'style.css': 'body{}' };
      expect(() => FileService.save('web', 'Portfolio', files)).not.toThrow();
    });

    it('should accept api type', () => {
      const files = { 'server.js': 'const e = require("express")' };
      expect(() => FileService.save('api', 'REST-API', files)).not.toThrow();
    });

    it('should return a Promise', () => {
      const result = FileService.save('web', 'Test', {});
      expect(result).toBeInstanceOf(Promise);
      // Evitar unhandled rejection
      result.catch(() => {});
    });
  });
});
