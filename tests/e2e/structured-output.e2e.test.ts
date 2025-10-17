import { describe, it, expect, beforeAll } from 'vitest';
import { z } from 'zod';
import { createClaudeAdapter } from '../../src/utils/factory';
import type { ClaudeAdapter } from '../../src/adapters/claude';

const shouldRunE2E = process.env.RUN_E2E_TESTS === 'true';

describe.skipIf(!shouldRunE2E)('E2E: Structured Output with Real CLIs', () => {
  let claude: ClaudeAdapter;

  beforeAll(() => {
    claude = createClaudeAdapter();
  });

  describe('JSON extraction without validation', () => {
    it('should extract JSON from Claude response', async () => {
      const response = await claude.execute(
        'Return a JSON object with keys: name="Test User", age=25, active=true. Return ONLY the JSON, wrapped in a markdown code block.',
        { responseSchema: true, timeout: 30000 }
      );

      expect(response.metadata.validation?.success).toBe(true);
      expect(typeof response.output).toBe('object');
      expect(response.output).toHaveProperty('name');
      expect(response.output).toHaveProperty('age');
      expect(response.output).toHaveProperty('active');

      // Original text preserved
      expect(response.raw?.stdout).toBeDefined();
      expect(response.raw?.stdout).toContain('json');
    }, 60000);

    it('should handle response without JSON gracefully', async () => {
      const response = await claude.execute(
        'Say hello world. Do not include any JSON in your response.',
        { responseSchema: true, timeout: 30000 }
      );

      expect(response.metadata.validation?.success).toBe(false);
      expect(response.metadata.validation?.errors).toContain('No JSON found in output');
      expect(response.output).toEqual({});
    }, 60000);
  });

  describe('JSON validation with Zod schema', () => {
    it('should validate response against Zod schema', async () => {
      const UserSchema = z.object({
        name: z.string(),
        age: z.number(),
        email: z.string().email(),
      });

      const response = await claude.execute(
        'Return a JSON object with: name="John Doe", age=30, email="john@example.com". Return ONLY the JSON in a markdown code block.',
        { responseSchema: UserSchema, timeout: 30000 }
      );

      expect(response.metadata.validation?.success).toBe(true);
      expect(response.metadata.validation?.errors).toBeUndefined();

      // TypeScript knows the structure (runtime check)
      expect(response.output).toHaveProperty('name');
      expect(response.output).toHaveProperty('age');
      expect(response.output).toHaveProperty('email');
      expect(typeof response.output.name).toBe('string');
      expect(typeof response.output.age).toBe('number');
    }, 60000);

    it('should handle complex nested schema', async () => {
      const WeatherSchema = z.object({
        location: z.object({
          city: z.string(),
          country: z.string(),
        }),
        temperature: z.number(),
        conditions: z.string(),
        humidity: z.number(),
      });

      const response = await claude.execute(
        'Return weather data as JSON: location with city="San Francisco" and country="USA", temperature=72, conditions="Sunny", humidity=60. Return ONLY the JSON in a markdown code block.',
        { responseSchema: WeatherSchema, timeout: 30000 }
      );

      expect(response.metadata.validation?.success).toBe(true);
      expect(response.output.location).toHaveProperty('city');
      expect(response.output.location).toHaveProperty('country');
      expect(typeof response.output.temperature).toBe('number');
    }, 60000);

    it('should handle array schema', async () => {
      const ItemSchema = z.object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
      });

      const ProductsSchema = z.array(ItemSchema);

      const response = await claude.execute(
        'Return an array of 3 products as JSON. Each product has id (number), name (string), price (number). Return ONLY the JSON array in a markdown code block.',
        { responseSchema: ProductsSchema, timeout: 30000 }
      );

      expect(response.metadata.validation?.success).toBe(true);
      expect(Array.isArray(response.output)).toBe(true);
      expect(response.output.length).toBeGreaterThan(0);
      if (response.output.length > 0) {
        expect(response.output[0]).toHaveProperty('id');
        expect(response.output[0]).toHaveProperty('name');
        expect(response.output[0]).toHaveProperty('price');
      }
    }, 60000);
  });

  describe('Validation failures', () => {
    it('should report validation errors but still return data', async () => {
      const StrictSchema = z.object({
        count: z.number().min(100), // Require count >= 100
        status: z.enum(['active', 'inactive']),
      });

      const response = await claude.execute(
        'Return JSON with count=5 (a number less than 100) and status="pending". Return ONLY the JSON in a markdown code block.',
        { responseSchema: StrictSchema, timeout: 30000 }
      );

      // Validation should fail
      expect(response.metadata.validation?.success).toBe(false);
      expect(response.metadata.validation?.errors).toBeDefined();

      // But data should still be returned as best effort
      expect(response.output).toBeDefined();
      expect(typeof response.output).toBe('object');
    }, 60000);
  });

  describe('Backwards compatibility', () => {
    it('should work normally without responseSchema', async () => {
      const response = await claude.execute('Say "Hello, World!"', {
        timeout: 30000,
      });

      expect(typeof response.output).toBe('string');
      expect(response.metadata.validation).toBeUndefined();
      expect(response.output).toContain('Hello');
    }, 60000);
  });

  describe('Schema transformations', () => {
    it('should apply Zod transformations and defaults', async () => {
      const Schema = z.object({
        name: z.string(),
        timestamp: z.string().optional(),
        count: z.number().default(0),
      });

      const response = await claude.execute(
        'Return JSON with just name="Test". Return ONLY the JSON in a markdown code block.',
        { responseSchema: Schema, timeout: 30000 }
      );

      expect(response.metadata.validation?.success).toBe(true);
      expect(response.output).toHaveProperty('name');
      expect(response.output).toHaveProperty('count');
      expect(response.output.count).toBe(0); // Default applied
    }, 60000);
  });
});
