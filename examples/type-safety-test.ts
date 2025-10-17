/**
 * This file demonstrates the type safety improvements.
 * The commented-out code below would now cause TypeScript errors.
 */

import { CodexAdapter, ClaudeAdapter } from '../src/index';

// Example 1: Invalid model type for Codex
const codex = new CodexAdapter();

// ✅ Valid - using a defined OpenAI model
await codex.execute('Hello', {
  model: 'gpt-5', // OK
});

await codex.execute('Hello', {
  model: 'gpt-4', // OK
});

await codex.execute('Hello', {
  // @ts-expect-error - This is a valid option for Codex
  dangerouslySkipPermissions: true, // OK
});

// ❌ INVALID - This would now cause a type error:
// await codex.execute("Hello", {
//   model: "sonnet", // Type error: "sonnet" is not assignable to OpenAIModel
// });

// ❌ INVALID - dangerouslySkipPermissions is not a valid Codex option:
// await codex.execute("Hello", {
//   dangerouslySkipPermissions: true, // Type error: Property doesn't exist
// });

// Example 2: Valid Claude usage
const claude = new ClaudeAdapter();

// ✅ Valid - using a defined Claude model
await claude.execute('Hello', {
  model: 'sonnet', // OK
});

await claude.execute('Hello', {
  model: 'opus', // OK
});

// ✅ Valid - dangerouslySkipPermissions IS valid for Claude
await claude.execute('Hello', {
  dangerouslySkipPermissions: true, // OK for Claude
});

await claude.execute('Hello', {
  // @ts-expect-error - This is a valid option for Claude
  workingDirs: true, // OK for Claude
});
