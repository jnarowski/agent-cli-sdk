import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateWithSchema } from '../../../src/utils/json-parser';

describe('validateWithSchema', () => {
  const UserSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  it('should validate correct data', async () => {
    const data = { name: 'John', age: 30 };
    const result = await validateWithSchema(data, UserSchema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid data types', async () => {
    const data = { name: 'John', age: 'thirty' }; // age should be number
    const result = await validateWithSchema(data, UserSchema);

    expect(result.success).toBe(false);
    expect(result.data).toEqual(data); // Best effort
    expect(result.errors).toBeDefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors?.[0]).toContain('age');
  });

  it('should handle missing required fields', async () => {
    const data = { name: 'John' }; // missing age
    const result = await validateWithSchema(data, UserSchema);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toContain('age');
    // Zod 4 error message for missing required fields
    expect(result.errors?.[0]).toContain('expected number');
  });

  it('should handle extra fields with default Zod behavior', async () => {
    const data = { name: 'John', age: 30, extra: 'field' };
    const result = await validateWithSchema(data, UserSchema);

    // By default, Zod strips extra fields
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 30 });
  });

  it('should validate nested objects', async () => {
    const AddressSchema = z.object({
      street: z.string(),
      city: z.string(),
      zip: z.number(),
    });

    const PersonSchema = z.object({
      name: z.string(),
      address: AddressSchema,
    });

    const data = {
      name: 'John',
      address: {
        street: '123 Main St',
        city: 'NYC',
        zip: 10001,
      },
    };

    const result = await validateWithSchema(data, PersonSchema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('should return errors for nested validation failures', async () => {
    const AddressSchema = z.object({
      street: z.string(),
      city: z.string(),
      zip: z.number(),
    });

    const PersonSchema = z.object({
      name: z.string(),
      address: AddressSchema,
    });

    const data = {
      name: 'John',
      address: {
        street: '123 Main St',
        city: 'NYC',
        zip: 'not-a-number', // invalid
      },
    };

    const result = await validateWithSchema(data, PersonSchema);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toContain('address.zip');
  });

  it('should validate arrays', async () => {
    const ItemSchema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const ListSchema = z.array(ItemSchema);

    const data = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];

    const result = await validateWithSchema(data, ListSchema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('should return errors for invalid array items', async () => {
    const ItemSchema = z.object({
      id: z.number(),
      name: z.string(),
    });

    const ListSchema = z.array(ItemSchema);

    const data = [
      { id: 1, name: 'Item 1' },
      { id: 'invalid', name: 'Item 2' }, // invalid id
    ];

    const result = await validateWithSchema(data, ListSchema);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toContain('1.id'); // Index 1, field id
  });

  it('should handle optional fields', async () => {
    const OptionalSchema = z.object({
      name: z.string(),
      age: z.number().optional(),
    });

    const data = { name: 'John' };
    const result = await validateWithSchema(data, OptionalSchema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(data);
  });

  it('should apply default values', async () => {
    const DefaultSchema = z.object({
      name: z.string(),
      age: z.number().default(0),
    });

    const data = { name: 'John' };
    const result = await validateWithSchema(data, DefaultSchema);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({ name: 'John', age: 0 });
  });

  it('should validate union types', async () => {
    const UnionSchema = z.object({
      value: z.union([z.string(), z.number()]),
    });

    const stringData = { value: 'hello' };
    const numberData = { value: 42 };

    const result1 = await validateWithSchema(stringData, UnionSchema);
    const result2 = await validateWithSchema(numberData, UnionSchema);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
  });

  it('should validate enum types', async () => {
    const StatusSchema = z.object({
      status: z.enum(['active', 'inactive', 'pending']),
    });

    const validData = { status: 'active' };
    const invalidData = { status: 'invalid' };

    const result1 = await validateWithSchema(validData, StatusSchema);
    const result2 = await validateWithSchema(invalidData, StatusSchema);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false);
    expect(result2.errors?.[0]).toContain('status');
  });

  it('should handle complex validations with refinements', async () => {
    const PasswordSchema = z
      .object({
        password: z.string().min(8),
        confirm: z.string(),
      })
      .refine((data) => data.password === data.confirm, {
        message: 'Passwords must match',
        path: ['confirm'],
      });

    const validData = { password: 'password123', confirm: 'password123' };
    const invalidData = { password: 'password123', confirm: 'different' };

    const result1 = await validateWithSchema(validData, PasswordSchema);
    const result2 = await validateWithSchema(invalidData, PasswordSchema);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(false);
    expect(result2.errors?.[0]).toContain('match');
  });
});
