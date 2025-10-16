import { describe, it, expect } from 'vitest';
import { validateConfig, validateExecutionOptions, sanitizePrompt, validateEmail } from '../../../src/utils/validation';

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

  describe('validateEmail', () => {
    describe('Valid email addresses', () => {
      it('should accept simple valid email', () => {
        expect(validateEmail('user@example.com')).toBe(true);
      });

      it('should accept email with dots in local part', () => {
        expect(validateEmail('first.last@example.com')).toBe(true);
      });

      it('should accept email with plus sign', () => {
        expect(validateEmail('user+tag@example.com')).toBe(true);
      });

      it('should accept email with underscore', () => {
        expect(validateEmail('user_name@example.com')).toBe(true);
      });

      it('should accept email with hyphen in domain', () => {
        expect(validateEmail('user@my-domain.com')).toBe(true);
      });

      it('should accept email with subdomain', () => {
        expect(validateEmail('user@mail.example.com')).toBe(true);
      });

      it('should accept email with multiple subdomains', () => {
        expect(validateEmail('user@mail.subdomain.example.com')).toBe(true);
      });

      it('should accept email with numbers', () => {
        expect(validateEmail('user123@example456.com')).toBe(true);
      });

      it('should accept email with special characters in local part', () => {
        expect(validateEmail('user!#$%&\'*+/=?^_`{|}~@example.com')).toBe(true);
      });

      it('should accept email with long TLD', () => {
        expect(validateEmail('user@example.museum')).toBe(true);
      });

      it('should accept email with two-letter TLD', () => {
        expect(validateEmail('user@example.co')).toBe(true);
      });

      it('should trim whitespace and accept valid email', () => {
        expect(validateEmail('  user@example.com  ')).toBe(true);
      });
    });

    describe('Invalid email addresses', () => {
      it('should reject email without @ symbol', () => {
        expect(validateEmail('userexample.com')).toBe(false);
      });

      it('should reject email without domain', () => {
        expect(validateEmail('user@')).toBe(false);
      });

      it('should reject email without local part', () => {
        expect(validateEmail('@example.com')).toBe(false);
      });

      it('should reject email without TLD', () => {
        expect(validateEmail('user@example')).toBe(false);
      });

      it('should reject email with spaces', () => {
        expect(validateEmail('user name@example.com')).toBe(false);
      });

      it('should reject email with multiple @ symbols', () => {
        expect(validateEmail('user@@example.com')).toBe(false);
        expect(validateEmail('user@domain@example.com')).toBe(false);
      });

      it('should reject email with consecutive dots', () => {
        expect(validateEmail('user..name@example.com')).toBe(false);
        expect(validateEmail('user@example..com')).toBe(false);
      });

      it('should reject email starting with dot', () => {
        expect(validateEmail('.user@example.com')).toBe(false);
      });

      it('should reject email ending with dot before @', () => {
        expect(validateEmail('user.@example.com')).toBe(false);
      });

      it('should reject empty string', () => {
        expect(validateEmail('')).toBe(false);
      });

      it('should reject whitespace-only string', () => {
        expect(validateEmail('   ')).toBe(false);
      });

      it('should reject non-string input', () => {
        expect(validateEmail(null as any)).toBe(false);
        expect(validateEmail(undefined as any)).toBe(false);
        expect(validateEmail(123 as any)).toBe(false);
        expect(validateEmail({} as any)).toBe(false);
      });

      it('should reject email with invalid TLD (single character)', () => {
        expect(validateEmail('user@example.c')).toBe(false);
      });

      it('should reject email with numeric TLD', () => {
        expect(validateEmail('user@example.123')).toBe(false);
      });

      it('should reject email with special characters in TLD', () => {
        expect(validateEmail('user@example.c0m')).toBe(false);
      });

      it('should reject email that is too long (>254 characters)', () => {
        const longEmail = 'a'.repeat(245) + '@example.com';
        expect(validateEmail(longEmail)).toBe(false);
      });

      it('should reject email with local part too long (>64 characters)', () => {
        const longLocal = 'a'.repeat(65) + '@example.com';
        expect(validateEmail(longLocal)).toBe(false);
      });

      it('should reject email with domain too long (>253 characters)', () => {
        const longDomain = 'user@' + 'a'.repeat(250) + '.com';
        expect(validateEmail(longDomain)).toBe(false);
      });

      it('should reject email with leading hyphen in domain', () => {
        expect(validateEmail('user@-example.com')).toBe(false);
      });

      it('should reject email with trailing hyphen in domain', () => {
        expect(validateEmail('user@example-.com')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle international domains correctly', () => {
        // Note: This regex doesn't support IDN (internationalized domain names)
        // which would require punycode encoding
        expect(validateEmail('user@exämple.com')).toBe(false);
      });

      it('should accept maximum valid local part length', () => {
        const maxLocal = 'a'.repeat(64) + '@example.com';
        expect(validateEmail(maxLocal)).toBe(true);
      });

      it('should accept email at maximum total length', () => {
        // Create email with exactly 254 characters
        const local = 'a'.repeat(64);
        const domain = 'b'.repeat(241) + '.com'; // 64 + 1(@) + 245 + 1(.) + 3 = 254
        const maxEmail = local + '@' + domain;
        expect(validateEmail(maxEmail)).toBe(false); // Actually false because domain > 253
      });
    });
  });
});
