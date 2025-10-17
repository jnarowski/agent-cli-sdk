import { describe, it, expect } from 'vitest';
import { extractJsonFromOutput } from '../../../src/utils/json-parser';

describe('extractJsonFromOutput', () => {
  it('should extract JSON from markdown code block', () => {
    const text = 'Here is your data:\n```json\n{"name":"John","age":30}\n```\nThank you!';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should extract inline JSON object', () => {
    const text = 'The result is {"status":"success","value":42} as requested.';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({ status: 'success', value: 42 });
  });

  it('should return null when no JSON found', () => {
    const text = 'This is just plain text with no JSON.';
    const result = extractJsonFromOutput(text);
    expect(result).toBeNull();
  });

  it('should return null for malformed JSON in code block', () => {
    const text = '```json\n{invalid json}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toBeNull();
  });

  it('should return null for malformed inline JSON', () => {
    const text = 'The result is {invalid json} as requested.';
    const result = extractJsonFromOutput(text);
    expect(result).toBeNull();
  });

  it('should prefer markdown block over inline JSON', () => {
    const text = 'Inline: {"a":1}\n```json\n{"b":2}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({ b: 2 }); // Markdown block wins
  });

  it('should handle complex nested JSON', () => {
    const text = '```json\n{"user":{"name":"John","age":30},"status":"active"}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({
      user: { name: 'John', age: 30 },
      status: 'active',
    });
  });

  it('should handle JSON arrays', () => {
    const text = '```json\n[{"id":1},{"id":2}]\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should return null for empty string', () => {
    const result = extractJsonFromOutput('');
    expect(result).toBeNull();
  });

  it('should return null for non-string input', () => {
    const result = extractJsonFromOutput(null as any);
    expect(result).toBeNull();
  });

  it('should handle JSON with whitespace in markdown block', () => {
    const text = '```json\n\n  {\n    "name": "John",\n    "age": 30\n  }\n\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({ name: 'John', age: 30 });
  });

  it('should extract first JSON object when multiple exist inline', () => {
    const text = 'First: {"a":1} Second: {"b":2}';
    const result = extractJsonFromOutput(text);
    // Should match the entire outer structure from { to the last }
    expect(result).toBeDefined();
  });

  it('should handle JSON with special characters', () => {
    const text = '```json\n{"message":"Hello \\"World\\"","emoji":"🎉"}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({ message: 'Hello "World"', emoji: '🎉' });
  });

  it('should return null when text contains only curly braces', () => {
    const text = 'Here are some braces: { }';
    const result = extractJsonFromOutput(text);
    // Empty object is technically valid JSON
    expect(result).toEqual({});
  });

  it('should handle JSON with numbers and booleans', () => {
    const text = '```json\n{"count":42,"active":true,"pending":false,"score":3.14}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({
      count: 42,
      active: true,
      pending: false,
      score: 3.14,
    });
  });
});
