/**
 * Example: Structured Output with JSON Extraction and Validation
 *
 * This example demonstrates how to extract and validate JSON from AI CLI responses
 * using the responseSchema option with optional Zod validation.
 */

import { createClaudeAdapter } from '../src/index';
import { z } from 'zod';

async function main() {
  const claude = createClaudeAdapter();

  console.log('='.repeat(60));
  console.log('Example 1: JSON extraction without validation');
  console.log('='.repeat(60));

  const response1 = await claude.execute(
    'Return a JSON object with keys: city="San Francisco", temperature=72, conditions="Sunny". ' +
      'Return ONLY the JSON wrapped in a markdown code block.',
    { responseSchema: true }
  );

  console.log('\nExtracted JSON:');
  console.log(JSON.stringify(response1.output, null, 2));
  console.log('\nValidation:', response1.metadata.validation);
  console.log('\nOriginal response (first 200 chars):');
  console.log(response1.raw?.stdout.substring(0, 200) + '...');

  console.log('\n' + '='.repeat(60));
  console.log('Example 2: JSON validation with Zod schema');
  console.log('='.repeat(60));

  const WeatherSchema = z.object({
    city: z.string(),
    temperature: z.number(),
    conditions: z.string(),
    humidity: z.number().optional(),
  });

  const response2 = await claude.execute(
    'Return weather data for New York as JSON: city, temperature (number), conditions, humidity (number). ' +
      'Return ONLY the JSON in a markdown code block.',
    { responseSchema: WeatherSchema }
  );

  console.log('\nValidated JSON:');
  console.log(JSON.stringify(response2.output, null, 2));
  console.log('\nValidation:', response2.metadata.validation);

  // TypeScript knows the structure!
  if (response2.metadata.validation?.success) {
    console.log(
      `\nIt's ${response2.output.temperature}°F in ${response2.output.city} with ${response2.output.conditions.toLowerCase()} conditions.`
    );
  }

  console.log('\n' + '='.repeat(60));
  console.log('Example 3: Complex nested schema');
  console.log('='.repeat(60));

  const UserProfileSchema = z.object({
    user: z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number(),
    }),
    preferences: z.object({
      theme: z.enum(['light', 'dark']),
      notifications: z.boolean(),
    }),
    tags: z.array(z.string()),
  });

  const response3 = await claude.execute(
    'Create a user profile JSON with nested objects: ' +
      'user (name, email, age), preferences (theme: light/dark, notifications: boolean), ' +
      'and an array of tags. Return ONLY the JSON in a markdown code block.',
    { responseSchema: UserProfileSchema }
  );

  console.log('\nComplex validated JSON:');
  console.log(JSON.stringify(response3.output, null, 2));
  console.log('\nValidation:', response3.metadata.validation);

  console.log('\n' + '='.repeat(60));
  console.log('Example 4: Array schema');
  console.log('='.repeat(60));

  const TaskSchema = z.object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    priority: z.enum(['low', 'medium', 'high']),
  });

  const TaskListSchema = z.array(TaskSchema);

  const response4 = await claude.execute(
    'Return a JSON array of 3 tasks. Each task has: id (number), title (string), ' +
      'completed (boolean), priority ("low", "medium", or "high"). ' +
      'Return ONLY the JSON array in a markdown code block.',
    { responseSchema: TaskListSchema }
  );

  console.log('\nTask list:');
  console.log(JSON.stringify(response4.output, null, 2));
  console.log('\nValidation:', response4.metadata.validation);

  if (Array.isArray(response4.output)) {
    console.log(`\nFound ${response4.output.length} tasks`);
    response4.output.forEach((task) => {
      console.log(
        `  - [${task.completed ? 'x' : ' '}] ${task.title} (${task.priority})`
      );
    });
  }

  console.log('\n' + '='.repeat(60));
  console.log('Example 5: Handling validation failures');
  console.log('='.repeat(60));

  const StrictSchema = z.object({
    count: z.number().min(100).max(1000),
    status: z.enum(['active', 'inactive', 'pending']),
  });

  const response5 = await claude.execute(
    'Return JSON with count=5 and status="invalid". Return ONLY the JSON in a markdown code block.',
    { responseSchema: StrictSchema }
  );

  console.log('\nInvalid data (best effort):');
  console.log(JSON.stringify(response5.output, null, 2));
  console.log('\nValidation result:');
  console.log('  Success:', response5.metadata.validation?.success);
  console.log('  Errors:', response5.metadata.validation?.errors);

  console.log('\n' + '='.repeat(60));
  console.log('Example 6: Schema with transformations and defaults');
  console.log('='.repeat(60));

  const ConfigSchema = z.object({
    name: z.string(),
    enabled: z.boolean().default(true),
    timeout: z.number().default(5000),
    createdAt: z.string().transform((str) => new Date(str)),
  });

  const response6 = await claude.execute(
    'Return JSON with just name="MyConfig" and createdAt="2024-01-01T12:00:00Z". ' +
      'Return ONLY the JSON in a markdown code block.',
    { responseSchema: ConfigSchema }
  );

  console.log('\nTransformed and defaulted config:');
  console.log('  name:', response6.output.name);
  console.log('  enabled:', response6.output.enabled, '(default)');
  console.log('  timeout:', response6.output.timeout, '(default)');
  console.log('  createdAt:', response6.output.createdAt, '(transformed to Date)');
  console.log('\nValidation:', response6.metadata.validation);

  console.log('\n' + '='.repeat(60));
  console.log('Example 7: No JSON found (graceful handling)');
  console.log('='.repeat(60));

  const response7 = await claude.execute(
    'Say hello world. Do not include any JSON in your response.',
    { responseSchema: true }
  );

  console.log('\nOutput when no JSON found:');
  console.log(JSON.stringify(response7.output, null, 2));
  console.log('\nValidation:', response7.metadata.validation);

  console.log('\n' + '='.repeat(60));
  console.log('All examples completed successfully!');
  console.log('='.repeat(60));
}

// Run the examples
main().catch((error) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
