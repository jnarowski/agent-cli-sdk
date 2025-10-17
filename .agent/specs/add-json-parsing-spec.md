# JSON Parsing with Optional Zod Schema Validation

## Overview

Add optional JSON extraction and validation from CLI output. When a Zod schema is provided, automatically parse and validate the response. Zod is a peer dependency - users install it only if they need structured output validation.

## Motivation

AI CLI tools (Claude Code, Codex) often return responses that mix natural language with structured JSON data. Users need a reliable way to:
1. Extract JSON from mixed text/JSON responses
2. Validate the structure matches expected types
3. Get type-safe parsed objects in TypeScript
4. Handle validation errors gracefully

## User Experience

### Installation
```bash
npm install @sourceborn/agent-cli-sdk
# Only if using structured output validation:
npm install zod
```

### Basic Usage - JSON Extraction Only
```typescript
import { createClaudeAdapter } from '@sourceborn/agent-cli-sdk';

const claude = createClaudeAdapter();

const response = await claude.execute(
  'Return a JSON object with keys: name, age, city',
  { responseSchema: true } // Auto-extract JSON without validation
);

console.log(response.output); // Parsed JSON object or {}
console.log(response.raw.stdout); // Original text with JSON
```

### Advanced Usage - With Zod Validation
```typescript
import { createClaudeAdapter } from '@sourceborn/agent-cli-sdk';
import { z } from 'zod';

const claude = createClaudeAdapter();

// Define expected structure
const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  city: z.string(),
});

const response = await claude.execute(
  'Return user data for John, age 30, from NYC as JSON',
  { responseSchema: UserSchema }
);

// response.output is fully typed as { name: string; age: number; city: string }
console.log(response.output.name); // TypeScript knows this is a string

// Check validation results
if (response.metadata.validation?.success) {
  console.log('Valid JSON:', response.output);
} else {
  console.log('Validation errors:', response.metadata.validation?.errors);
  console.log('Best effort parse:', response.output);
}
```

## Technical Design

### 1. Peer Dependency Setup

**package.json changes:**
```json
{
  "peerDependencies": {
    "zod": "^3.0.0"
  },
  "peerDependenciesMeta": {
    "zod": {
      "optional": true
    }
  },
  "devDependencies": {
    "zod": "^3.23.0"
  }
}
```

**Why peer dependency?**
- Users need Zod to create schemas anyway
- Avoids type version conflicts between user's Zod and SDK's Zod
- Keeps bundle size small for users who don't need validation
- Standard practice for validation libraries in SDKs

### 2. ExecutionOptions Extension

**File: `src/types/config.ts`**

Add to `ExecutionOptions` interface:
```typescript
export interface ExecutionOptions {
  // ... existing options ...

  /**
   * Optional schema for validating and parsing JSON response
   * - Pass `true` to enable JSON extraction without validation
   * - Pass a Zod schema to validate structure (requires zod peer dependency)
   * - When provided, automatically extracts JSON from CLI output
   * - Original text preserved in response.raw.stdout
   */
  responseSchema?: any | true;
}
```

**Type Design Decision:**
- Use `any` instead of `z.ZodType` to avoid requiring zod types when not used
- Users who import zod will get proper type inference
- TypeScript will infer output type from schema at call site

### 3. JSON Extraction Utility

**File: `src/utils/json-parser.ts` (new file)**

```typescript
/**
 * Extract JSON from text that may contain mixed content
 * Tries multiple strategies in order of preference
 */
export function extractJsonFromOutput(text: string): unknown | null {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Strategy 1: Look for ```json markdown code blocks
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/;
  const jsonBlockMatch = text.match(jsonBlockRegex);

  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Look for first JSON object in text
  const jsonObjectRegex = /\{[\s\S]*\}/;
  const jsonObjectMatch = text.match(jsonObjectRegex);

  if (jsonObjectMatch && jsonObjectMatch[0]) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {
      // Failed to parse
    }
  }

  // No valid JSON found
  return null;
}

/**
 * Validate data against a Zod schema
 * Dynamically imports Zod to handle optional peer dependency
 */
export async function validateWithSchema<T = any>(
  data: unknown,
  schema: any
): Promise<{
  success: boolean;
  data: T | null;
  errors?: string[];
}> {
  try {
    // Dynamic import of Zod (peer dependency)
    const zodModule = await import('zod');

    // Validate with safeParse (never throws)
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data as T,
      };
    } else {
      // Format Zod errors into readable strings
      const errors = result.error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      );

      return {
        success: false,
        data: data as T, // Return raw data as best effort
        errors,
      };
    }
  } catch (importError) {
    // Zod not installed
    throw new Error(
      'responseSchema validation requires zod to be installed.\n' +
      'Install it with: npm install zod\n' +
      'Or use responseSchema: true for JSON extraction without validation.'
    );
  }
}
```

**Key Features:**
- Two-stage parsing: markdown blocks first, then inline JSON
- Graceful failure: returns `null` instead of throwing
- Dynamic Zod import: helpful error if not installed
- `safeParse`: validation never throws
- Formatted errors: convert Zod errors to readable strings

### 4. Parser Updates

**File: `src/adapters/claude/parser.ts`**

Update `parseStreamOutput` signature and implementation:

```typescript
export async function parseStreamOutput(
  output: string,
  duration: number,
  exitCode: number,
  responseSchema?: any | true
): Promise<AdapterResponse> {
  // ... existing parsing logic to extract finalOutput ...

  let parsedOutput: any = finalOutput;
  let validationMetadata: { success: boolean; errors?: string[] } | undefined;

  // Handle responseSchema if provided
  if (responseSchema) {
    const extracted = extractJsonFromOutput(finalOutput);

    if (extracted === null) {
      // No JSON found - return empty object
      parsedOutput = {};
      validationMetadata = {
        success: false,
        errors: ['No JSON found in output'],
      };
    } else if (responseSchema === true) {
      // JSON extraction only (no validation)
      parsedOutput = extracted;
      validationMetadata = { success: true };
    } else {
      // Validate with schema
      const validation = await validateWithSchema(extracted, responseSchema);
      parsedOutput = validation.data ?? extracted;
      validationMetadata = {
        success: validation.success,
        errors: validation.errors,
      };
    }
  }

  return {
    output: parsedOutput,
    sessionId,
    status: exitCode === 0 ? 'success' : 'error',
    exitCode,
    duration,
    actions,
    metadata: {
      model,
      toolsUsed: Array.from(toolsUsed),
      filesModified: Array.from(filesModified),
      validation: validationMetadata,
    },
    raw: {
      stdout: output,
      stderr: '',
      events,
    },
  };
}
```

**Changes:**
1. Make function `async` to support dynamic import
2. Add `responseSchema` parameter
3. Extract JSON when schema provided
4. Validate if schema is Zod schema (not `true`)
5. Add validation metadata to response
6. Replace `output` with parsed/validated data

**File: `src/adapters/codex/parser.ts`**

Apply identical changes to maintain consistency across adapters.

### 5. Adapter Integration

**File: `src/adapters/claude/index.ts`**

Update `execute()` method to pass schema to parser:

```typescript
async execute(
  prompt: string,
  options: ClaudeExecutionOptions = {}
): Promise<AdapterResponse> {
  // ... existing validation and CLI execution ...

  try {
    const result = await executeClaudeCLI(this.cliPath, prompt, {
      verbose: this.config.verbose,
      workingDir: this.config.workingDir,
      ...mergedOptions,
    });

    // Parse output - pass responseSchema if provided
    response = await parseStreamOutput(
      result.stdout,
      result.duration,
      result.exitCode,
      mergedOptions.responseSchema // NEW: pass schema to parser
    );

    // ... rest of error handling ...
  }
}
```

**File: `src/adapters/codex/index.ts`**

Apply identical changes.

### 6. Response Type Updates

**File: `src/types/config.ts`**

Update `AdapterResponse` interface:

```typescript
export interface AdapterResponse {
  /** Final output from the AI (string or parsed JSON object if responseSchema used) */
  output: string | Record<string, any>;

  // ... other fields ...

  /** Response metadata */
  metadata: {
    /** Model used for execution */
    model?: string;
    /** Tokens consumed (if available) */
    tokensUsed?: number;
    /** Tools/functions that were called */
    toolsUsed?: string[];
    /** Files that were modified */
    filesModified?: string[];
    /** JSON parsing and validation results (when responseSchema is used) */
    validation?: {
      /** Whether validation succeeded */
      success: boolean;
      /** Validation error messages (if validation failed) */
      errors?: string[];
    };
  };

  // ... rest of interface ...
}
```

## Testing Strategy

### Unit Tests

**File: `tests/unit/json-parser.test.ts` (new file)**

```typescript
import { describe, it, expect } from 'vitest';
import { extractJsonFromOutput } from '../../src/utils/json-parser';

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

  it('should return null for malformed JSON', () => {
    const text = '```json\n{invalid json}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toBeNull();
  });

  it('should prefer markdown block over inline JSON', () => {
    const text = 'Inline: {"a":1}\n```json\n{"b":2}\n```';
    const result = extractJsonFromOutput(text);
    expect(result).toEqual({ b: 2 }); // Markdown block wins
  });
});
```

**File: `tests/unit/json-validation.test.ts` (new file)**

```typescript
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateWithSchema } from '../../src/utils/json-parser';

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

  it('should return errors for invalid data', async () => {
    const data = { name: 'John', age: 'thirty' }; // age should be number
    const result = await validateWithSchema(data, UserSchema);

    expect(result.success).toBe(false);
    expect(result.data).toEqual(data); // Best effort
    expect(result.errors).toBeDefined();
    expect(result.errors?.[0]).toContain('age');
  });

  it('should handle missing required fields', async () => {
    const data = { name: 'John' }; // missing age
    const result = await validateWithSchema(data, UserSchema);

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
  });
});
```

### Integration Tests

**File: `tests/integration/structured-output.test.ts` (new file)**

Test full execution flow with responseSchema.

### E2E Tests

**File: `tests/e2e/claude-structured-output.e2e.test.ts` (new file)**

Test with real Claude CLI (when `RUN_E2E_TESTS=true`).

## Examples

**File: `examples/structured-output.ts` (new file)**

```typescript
import { createClaudeAdapter } from '../src/index';
import { z } from 'zod';

async function main() {
  const claude = createClaudeAdapter();

  // Example 1: JSON extraction only
  console.log('Example 1: JSON extraction without validation');
  const response1 = await claude.execute(
    'Return JSON with keys: city, temperature, conditions',
    { responseSchema: true }
  );
  console.log('Parsed:', response1.output);
  console.log('Original:', response1.raw?.stdout);

  // Example 2: With validation
  console.log('\nExample 2: With Zod schema validation');
  const WeatherSchema = z.object({
    city: z.string(),
    temperature: z.number(),
    conditions: z.string(),
  });

  const response2 = await claude.execute(
    'Return weather for San Francisco as JSON: city, temperature (number), conditions',
    { responseSchema: WeatherSchema }
  );

  console.log('Validated:', response2.output);
  console.log('Validation success:', response2.metadata.validation?.success);

  // TypeScript knows the structure
  if (response2.metadata.validation?.success) {
    console.log(`It's ${response2.output.temperature}°F in ${response2.output.city}`);
  }
}

main();
```

## Documentation Updates

### README.md

Add new section:

```markdown
## Structured Output with JSON Parsing

Extract and validate JSON responses from AI CLI tools.

### Installation

```bash
npm install @sourceborn/agent-cli-sdk
# For schema validation:
npm install zod
```

### Basic JSON Extraction

```typescript
const response = await claude.execute(
  'Return user data as JSON',
  { responseSchema: true }
);
console.log(response.output); // Parsed JSON object
```

### Type-Safe Validation with Zod

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
});

const response = await claude.execute(
  'Return user data as JSON',
  { responseSchema: UserSchema }
);

// response.output is typed as { name: string; age: number }
```

### Validation Metadata

Check validation results:
```typescript
if (response.metadata.validation?.success) {
  console.log('Valid:', response.output);
} else {
  console.log('Errors:', response.metadata.validation?.errors);
}
```
```

### CLAUDE.md

Update project instructions with new feature details.

## Implementation Phases

### Phase 1: Core JSON Extraction (No Dependencies)
1. Add `responseSchema: true` support to ExecutionOptions
2. Implement `extractJsonFromOutput()` utility
3. Update parsers to extract JSON when `responseSchema: true`
4. Add unit tests for extraction
5. Update examples and README

### Phase 2: Zod Integration (Peer Dependency)
1. Add zod to peerDependencies and devDependencies
2. Implement `validateWithSchema()` with dynamic import
3. Update parsers to handle Zod schemas
4. Add validation metadata to responses
5. Add unit tests for validation
6. Add integration and E2E tests
7. Update documentation

## Success Criteria

- [ ] Users can pass `responseSchema: true` to extract JSON
- [ ] Users can pass Zod schemas for type-safe validation
- [ ] Zod is optional - SDK works without it installed
- [ ] Helpful error message if schema used but Zod not installed
- [ ] Original text preserved in `response.raw.stdout`
- [ ] Validation results in `response.metadata.validation`
- [ ] TypeScript inference works for schema output types
- [ ] All tests pass (unit, integration, E2E)
- [ ] Documentation complete with examples
- [ ] No breaking changes to existing API

## Non-Goals

- Supporting other validation libraries (only Zod for now)
- Automatic retries on validation failure (future enhancement)
- Prompt engineering to improve JSON generation (user responsibility)
- JSON extraction from streaming events (only final output)
