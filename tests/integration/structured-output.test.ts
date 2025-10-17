import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { parseStreamOutput as parseClaudeStream } from '../../src/adapters/claude/parser';
import { parseStreamOutput as parseCodexStream } from '../../src/adapters/codex/parser';

describe('Structured Output Integration', () => {
  describe('Claude adapter with responseSchema', () => {
    it('should extract JSON from markdown code block', async () => {
      const output = `Here is your data:
\`\`\`json
{"name":"John","age":30,"city":"NYC"}
\`\`\`
Thank you!`;

      const result = await parseClaudeStream(output, 1000, 0, true);

      expect(result.output).toEqual({ name: 'John', age: 30, city: 'NYC' });
      expect(result.metadata.validation).toEqual({ success: true });
      expect(result.raw?.stdout).toBe(output);
    });

    it('should extract inline JSON', async () => {
      const output = 'The result is {"status":"success","value":42} as requested.';

      const result = await parseClaudeStream(output, 1000, 0, true);

      expect(result.output).toEqual({ status: 'success', value: 42 });
      expect(result.metadata.validation).toEqual({ success: true });
    });

    it('should return empty object when no JSON found', async () => {
      const output = 'This is just plain text with no JSON.';

      const result = await parseClaudeStream(output, 1000, 0, true);

      expect(result.output).toEqual({});
      expect(result.metadata.validation).toEqual({
        success: false,
        errors: ['No JSON found in output'],
      });
    });

    it('should validate with Zod schema and succeed', async () => {
      const output = '```json\n{"name":"John","age":30,"city":"NYC"}\n```';

      const UserSchema = z.object({
        name: z.string(),
        age: z.number(),
        city: z.string(),
      });

      const result = await parseClaudeStream(output, 1000, 0, UserSchema);

      expect(result.output).toEqual({ name: 'John', age: 30, city: 'NYC' });
      expect(result.metadata.validation?.success).toBe(true);
      expect(result.metadata.validation?.errors).toBeUndefined();
    });

    it('should validate with Zod schema and fail gracefully', async () => {
      const output = '```json\n{"name":"John","age":"thirty"}\n```';

      const UserSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = await parseClaudeStream(output, 1000, 0, UserSchema);

      // Should still return the data as best effort
      expect(result.output).toEqual({ name: 'John', age: 'thirty' });
      expect(result.metadata.validation?.success).toBe(false);
      expect(result.metadata.validation?.errors).toBeDefined();
      expect(result.metadata.validation?.errors?.[0]).toContain('age');
    });

    it('should handle complex nested schema', async () => {
      const output = `\`\`\`json
{
  "user": {
    "name": "John",
    "age": 30
  },
  "address": {
    "street": "123 Main St",
    "city": "NYC",
    "zip": 10001
  }
}
\`\`\``;

      const AddressSchema = z.object({
        street: z.string(),
        city: z.string(),
        zip: z.number(),
      });

      const ResponseSchema = z.object({
        user: z.object({
          name: z.string(),
          age: z.number(),
        }),
        address: AddressSchema,
      });

      const result = await parseClaudeStream(output, 1000, 0, ResponseSchema);

      expect(result.output).toEqual({
        user: { name: 'John', age: 30 },
        address: { street: '123 Main St', city: 'NYC', zip: 10001 },
      });
      expect(result.metadata.validation?.success).toBe(true);
    });

    it('should work with JSONL stream events', async () => {
      const jsonl = `{"type":"turn.started","timestamp":1234567890}
{"type":"result","result":"{\\"name\\":\\"John\\",\\"age\\":30}","session_id":"test-123"}
{"type":"turn.completed","timestamp":1234567891}`;

      const UserSchema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = await parseClaudeStream(jsonl, 1000, 0, UserSchema);

      expect(result.output).toEqual({ name: 'John', age: 30 });
      expect(result.metadata.validation?.success).toBe(true);
      expect(result.sessionId).toBe('test-123');
    });

    it('should not affect output when responseSchema is not provided', async () => {
      const output = 'Plain text output without JSON';

      const result = await parseClaudeStream(output, 1000, 0);

      expect(result.output).toBe('Plain text output without JSON');
      expect(result.metadata.validation).toBeUndefined();
    });
  });

  describe('Codex adapter with responseSchema', () => {
    it('should extract JSON from markdown code block', async () => {
      const output = `Here is your data:
\`\`\`json
{"name":"Alice","role":"engineer"}
\`\`\`
Done!`;

      const result = await parseCodexStream(output, 1000, 0, 'gpt-5', true);

      expect(result.output).toEqual({ name: 'Alice', role: 'engineer' });
      expect(result.metadata.validation).toEqual({ success: true });
      expect(result.raw?.stdout).toBe(output);
    });

    it('should validate with Zod schema', async () => {
      const output = '```json\n{"name":"Alice","role":"engineer","level":5}\n```';

      const EmployeeSchema = z.object({
        name: z.string(),
        role: z.string(),
        level: z.number(),
      });

      const result = await parseCodexStream(output, 1000, 0, 'gpt-5', EmployeeSchema);

      expect(result.output).toEqual({ name: 'Alice', role: 'engineer', level: 5 });
      expect(result.metadata.validation?.success).toBe(true);
    });

    it('should return empty object when no JSON found', async () => {
      const output = 'No JSON here, just text.';

      const result = await parseCodexStream(output, 1000, 0, 'gpt-5', true);

      expect(result.output).toEqual({});
      expect(result.metadata.validation).toEqual({
        success: false,
        errors: ['No JSON found in output'],
      });
    });

    it('should work with JSONL turn events', async () => {
      const jsonl = `{"type":"turn.started","timestamp":1234567890,"thread_id":"thread-456"}
{"type":"turn.completed","output":"{\\"result\\":\\"success\\",\\"count\\":10}","usage":{"input_tokens":100,"output_tokens":50}}`;

      const ResultSchema = z.object({
        result: z.string(),
        count: z.number(),
      });

      const result = await parseCodexStream(jsonl, 1000, 0, 'gpt-5', ResultSchema);

      expect(result.output).toEqual({ result: 'success', count: 10 });
      expect(result.metadata.validation?.success).toBe(true);
      expect(result.sessionId).toBe('thread-456');
    });

    it('should not affect output when responseSchema is not provided', async () => {
      const output = 'Regular text output';

      const result = await parseCodexStream(output, 1000, 0, 'gpt-5');

      expect(result.output).toBe('Regular text output');
      expect(result.metadata.validation).toBeUndefined();
    });
  });

  describe('Type coercion and transformations', () => {
    it('should apply Zod transformations', async () => {
      const output = '```json\n{"timestamp":"2024-01-01T12:00:00Z","value":42}\n```';

      const Schema = z.object({
        timestamp: z.string().transform((str) => new Date(str)),
        value: z.number(),
      });

      const result = await parseClaudeStream(output, 1000, 0, Schema);

      expect(result.metadata.validation?.success).toBe(true);
      expect(result.output.timestamp).toBeInstanceOf(Date);
      expect(result.output.value).toBe(42);
    });

    it('should apply default values', async () => {
      const output = '```json\n{"name":"John"}\n```';

      const Schema = z.object({
        name: z.string(),
        age: z.number().default(0),
        active: z.boolean().default(true),
      });

      const result = await parseClaudeStream(output, 1000, 0, Schema);

      expect(result.output).toEqual({ name: 'John', age: 0, active: true });
      expect(result.metadata.validation?.success).toBe(true);
    });

    it('should strip unknown keys by default', async () => {
      const output = '```json\n{"name":"John","age":30,"unknown":"field"}\n```';

      const Schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      const result = await parseClaudeStream(output, 1000, 0, Schema);

      expect(result.output).toEqual({ name: 'John', age: 30 });
      expect(result.output).not.toHaveProperty('unknown');
      expect(result.metadata.validation?.success).toBe(true);
    });
  });
});
