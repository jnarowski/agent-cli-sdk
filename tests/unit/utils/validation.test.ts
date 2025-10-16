import { describe, it, expect } from 'vitest';
import { validateConfig, validateExecutionOptions, sanitizePrompt } from '../../../src/utils/validation';

describe('Validation Utilities', () => {
  describe('validateConfig', () => {
    it('should accept valid Claude config', () => {
      const config = {
        apiKey: 'sk-ant-valid-key',
      };

      expect(() => validateConfig('claude', config)).not.toThrow();
    });

    it('should accept valid Codex config', () => {
      const config = {
        apiKey: 'valid-api-key',
      };

      expect(() => validateConfig('codex', config)).not.toThrow();
    });

    it('should accept empty config', () => {
      expect(() => validateConfig('claude', {})).not.toThrow();
      expect(() => validateConfig('codex', {})).not.toThrow();
    });

    it('should reject invalid config types', () => {
      // null and undefined are allowed (empty config)
      expect(() => validateConfig('claude', 'string' as any)).toThrow();
      expect(() => validateConfig('claude', 123 as any)).toThrow();
      expect(() => validateConfig('claude', [] as any)).toThrow();
    });
  });

  describe('validateExecutionOptions', () => {
    it('should accept valid execution options', () => {
      const options = {
        streaming: true,
        timeout: 30000,
        model: 'claude-sonnet-4-5',
      };

      expect(() => validateExecutionOptions(options)).not.toThrow();
    });

    it('should reject negative timeout', () => {
      const options = {
        timeout: -1000,
      };

      expect(() => validateExecutionOptions(options)).toThrow(/timeout/i);
    });

    it('should reject invalid streaming value', () => {
      const options = {
        streaming: 'yes' as any,
      };

      expect(() => validateExecutionOptions(options)).toThrow(/streaming/i);
    });

    it('should reject invalid onStream callback', () => {
      const options = {
        streaming: true,
        onStream: 'not-a-function' as any,
      };

      expect(() => validateExecutionOptions(options)).toThrow(/onStream/i);
    });

    it('should accept empty options', () => {
      expect(() => validateExecutionOptions({})).not.toThrow();
    });

    it('should warn if onStream without streaming', () => {
      const options = {
        onStream: () => {},
      };

      // Should not throw but could log warning
      expect(() => validateExecutionOptions(options)).not.toThrow();
    });
  });

  describe('sanitizePrompt', () => {
    it('should return prompt unchanged for normal text', () => {
      const prompt = 'Create a function to validate emails';
      expect(sanitizePrompt(prompt)).toBe(prompt);
    });

    it('should trim whitespace', () => {
      const prompt = '  Create a function  ';
      expect(sanitizePrompt(prompt)).toBe('Create a function');
    });

    it('should reject empty prompts', () => {
      expect(() => sanitizePrompt('')).toThrow(/empty/i);
      expect(() => sanitizePrompt('   ')).toThrow(/empty/i);
    });

    it('should handle multi-line prompts', () => {
      const prompt = 'Line 1\nLine 2\nLine 3';
      const result = sanitizePrompt(prompt);
      expect(result).toBe(prompt);
    });

    it('should handle special characters', () => {
      const prompt = 'Create function with $var and @param';
      expect(sanitizePrompt(prompt)).toBe(prompt);
    });

    it('should enforce maximum length', () => {
      const longPrompt = 'a'.repeat(100000);
      expect(() => sanitizePrompt(longPrompt)).toThrow(/too long/i);
    });
  });
});
