/**
 * Example: Type Safety Best Practices
 *
 * This example shows the recommended patterns for type-safe usage
 * and explains common pitfalls to avoid.
 */

import { createClaudeAdapter } from '../src/index';
import { z } from 'zod';

async function main() {
  const claude = createClaudeAdapter();

  console.log('='.repeat(60));
  console.log('✅ RECOMMENDED: Let Zod infer the type');
  console.log('='.repeat(60));

  const UserSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  // Best practice: Use z.infer to get the type from the schema
  type User = z.infer<typeof UserSchema>;

  // TypeScript automatically infers the correct type
  const response = await claude.execute<User>(
    'Return JSON: {"name": "Alice", "age": 30}',
    { responseSchema: UserSchema }
  );

  // Fully typed!
  const name: string = response.output.name;
  const age: number = response.output.age;
  console.log(`User: ${name}, Age: ${age}`);

  console.log('\n' + '='.repeat(60));
  console.log('⚠️  WORKS BUT LESS TYPE-SAFE: Using responseSchema: true');
  console.log('='.repeat(60));

  // When you use responseSchema: true (no Zod schema)
  // You need to manually specify the type
  type ApiResponse = { status: string; count: number };

  const response2 = await claude.execute<ApiResponse>(
    'Return JSON: {"status": "ok", "count": 42}',
    { responseSchema: true }
  );

  // TypeScript trusts you, but there's no runtime validation!
  // If the AI returns different fields, you'll get runtime errors
  console.log(`Status: ${response2.output.status}`);
  console.log(`Count: ${response2.output.count}`);

  console.log('\n' + '='.repeat(60));
  console.log('❌ INCORRECT: Generic without responseSchema');
  console.log('='.repeat(60));

  // This is a type safety hole - DON'T DO THIS
  type Message = { text: string };

  // TypeScript thinks the output is Message, but it's actually a string!
  const badResponse = await claude.execute<Message>('Say hello');

  // At runtime, badResponse.output is a string, not an object
  console.log('Type of output:', typeof badResponse.output);
  console.log('Actual value:', badResponse.output);

  // This would cause a runtime error if uncommented:
  // console.log(badResponse.output.text); // TypeError: Cannot read property 'text' of undefined

  console.log('\n' + '='.repeat(60));
  console.log('✅ CORRECT: No generic when no responseSchema');
  console.log('='.repeat(60));

  // When NOT using responseSchema, don't specify a generic type
  const textResponse = await claude.execute('Say hello');

  // response.output is string | Record<string, any>
  // You need to check the type at runtime
  if (typeof textResponse.output === 'string') {
    console.log('Text response:', textResponse.output);
  } else {
    console.log('JSON response:', JSON.stringify(textResponse.output));
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary of Best Practices:');
  console.log('='.repeat(60));
  console.log('1. ✅ Use Zod schemas for full type safety and validation');
  console.log('2. ✅ Use z.infer<typeof Schema> to extract types');
  console.log('3. ⚠️  Use responseSchema: true only for simple cases');
  console.log('4. ❌ Never use generic <T> without responseSchema');
  console.log('5. ✅ Omit generic when not using responseSchema');
  console.log('='.repeat(60));
}

// Run the examples
main().catch((error) => {
  console.error('Error running examples:', error);
  process.exit(1);
});
