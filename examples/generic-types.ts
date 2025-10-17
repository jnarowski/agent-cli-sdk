/**
 * Example: Using Generic Types with responseSchema
 *
 * This example demonstrates how to use TypeScript generics to get proper type inference
 * when using responseSchema with Zod validation.
 */

import { createClaudeAdapter } from '../src/index';
import { z } from 'zod';

// Define a type-safe validation result schema
const ValidationResultSchema = z.object({
  success: z.boolean(),
  validation_command: z.string(),
  issues: z.object({
    errors: z.number(),
    warnings: z.number(),
    info: z.number(),
  }),
});

// Infer the TypeScript type from the Zod schema
type ValidationResult = z.infer<typeof ValidationResultSchema>;

async function main() {
  const claude = createClaudeAdapter();

  console.log('='.repeat(60));
  console.log('Generic Type Inference Example');
  console.log('='.repeat(60));

  // Execute with generic type parameter
  const response = await claude.execute<ValidationResult>(
    'Return a JSON object with: success=true, validation_command="pnpm check", ' +
      'and issues object with errors=2, warnings=0, info=0. ' +
      'Return ONLY the JSON in a markdown code block.',
    { responseSchema: ValidationResultSchema }
  );

  // TypeScript now knows the exact shape of response.output
  console.log('\nValidation result:');
  console.log(`  Success: ${response.output.success}`);
  console.log(`  Command: ${response.output.validation_command}`);
  console.log(`  Errors: ${response.output.issues.errors}`);
  console.log(`  Warnings: ${response.output.issues.warnings}`);
  console.log(`  Info: ${response.output.issues.info}`);

  // TypeScript autocomplete works perfectly here!
  const errorCount: number = response.output.issues.errors;
  const isValid: boolean = response.output.success;

  console.log(`\n✓ Found ${errorCount} errors (validation ${isValid ? 'succeeded' : 'failed'})`);

  console.log('\n' + '='.repeat(60));
  console.log('Array Type Example');
  console.log('='.repeat(60));

  // Define a schema for an array of items
  const TaskSchema = z.object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
  });

  const TaskListSchema = z.array(TaskSchema);
  type TaskList = z.infer<typeof TaskListSchema>;

  const taskResponse = await claude.execute<TaskList>(
    'Return a JSON array of 3 tasks. Each task has: id (number), title (string), completed (boolean). ' +
      'Return ONLY the JSON array in a markdown code block.',
    { responseSchema: TaskListSchema }
  );

  // TypeScript knows this is an array
  console.log(`\nFound ${taskResponse.output.length} tasks:`);
  taskResponse.output.forEach((task) => {
    // Full type safety and autocomplete!
    console.log(`  - [${task.completed ? 'x' : ' '}] #${task.id}: ${task.title}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('Nested Object Example');
  console.log('='.repeat(60));

  // Complex nested schema
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
  });

  type UserProfile = z.infer<typeof UserProfileSchema>;

  const profileResponse = await claude.execute<UserProfile>(
    'Create a user profile JSON with: user.name="Alice", user.email="alice@example.com", ' +
      'user.age=28, preferences.theme="dark", preferences.notifications=true. ' +
      'Return ONLY the JSON in a markdown code block.',
    { responseSchema: UserProfileSchema }
  );

  // Full type safety for deeply nested objects
  const userName: string = profileResponse.output.user.name;
  const userTheme: 'light' | 'dark' = profileResponse.output.preferences.theme;

  console.log(`\nUser: ${userName}`);
  console.log(`Email: ${profileResponse.output.user.email}`);
  console.log(`Age: ${profileResponse.output.user.age}`);
  console.log(`Theme: ${userTheme}`);
  console.log(`Notifications: ${profileResponse.output.preferences.notifications ? 'on' : 'off'}`);

  console.log('\n' + '='.repeat(60));
  console.log('Without Generic (Fallback to Default)');
  console.log('='.repeat(60));

  // When you don't specify a generic, it defaults to string | Record<string, any>
  const genericResponse = await claude.execute(
    'Return a simple JSON object: {"status":"ok"}. Return ONLY the JSON in a markdown code block.',
    { responseSchema: true }
  );

  // TypeScript infers: string | Record<string, any>
  // You need to check or cast the type
  if (typeof genericResponse.output !== 'string') {
    console.log('\nGeneric response (untyped):');
    console.log(JSON.stringify(genericResponse.output, null, 2));
  }

  console.log('\n' + '='.repeat(60));
  console.log('All examples completed successfully!');
  console.log('='.repeat(60));
}

// Run the examples
main().catch((error) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
