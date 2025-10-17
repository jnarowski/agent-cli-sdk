# Agent CLI SDK

TypeScript SDK for orchestrating AI-powered CLI tools (Claude Code, OpenAI Codex) in development workflows.

## Features

- **Unified Interface**: Common API for multiple AI CLI tools
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Real-time event streaming for both Claude and Codex
- **Session Management**: Resume and continue conversations (Claude)
- **Structured Output**: Extract and validate JSON responses with optional Zod schemas
- **Error Handling**: Standardized error types with recovery suggestions
- **Workflow Utilities**: Built-in helpers for sequential, parallel, and retry operations
- **Auto-Detection**: Automatically finds CLI binaries in your PATH
- **Factory Pattern**: Easy instantiation with sensible defaults

## Prerequisites

- Node.js 22 or higher
- Claude Code CLI (for Claude adapter) - [Download](https://claude.ai/download)
- Codex CLI (for Codex adapter) - [Install Instructions](https://codex.openai.com)

## Installation

```bash
pnpm add @sourceborn/agent-cli-sdk

# Optional: Install Zod for structured output validation
pnpm add zod
```

Or with npm:

```bash
npm install @sourceborn/agent-cli-sdk

# Optional: Install Zod for structured output validation
npm install zod
```

## Quick Start

### Basic Usage (Claude)

```typescript
import { createClaudeAdapter } from '@sourceborn/agent-cli-sdk';

const claude = createClaudeAdapter();

const response = await claude.execute('Create a hello world function');

console.log(response.output);
console.log(`Session: ${response.sessionId}`);
console.log(`Duration: ${response.duration}ms`);
```

### Basic Usage (Codex)

```typescript
import { createCodexAdapter } from '@sourceborn/agent-cli-sdk';

const codex = createCodexAdapter();

const response = await codex.execute('Review this code for security issues', {
  fullAuto: true,
});

console.log(response.output);
```

### Streaming

```typescript
const response = await claude.execute('Write a REST API', {
  streaming: true,
  onStream: (event) => {
    if (event.type === 'message.chunk') {
      process.stdout.write(event.data.content || '');
    }
    if (event.type === 'tool.started') {
      console.log(`\n🔧 Using ${event.data.toolName}...`);
    }
  },
});
```

### Multi-Agent Workflow

```typescript
import { createClaudeAdapter, createCodexAdapter } from '@sourceborn/agent-cli-sdk';

const claude = createClaudeAdapter();
const codex = createCodexAdapter();

// Step 1: Generate code
const generated = await claude.execute('Create an email validator function');

// Step 2: Review with Codex
const review = await codex.execute('Review the email validator for security issues', {
  fullAuto: true,
});

// Step 3: Apply improvements
const improved = await claude.execute(
  `Apply these suggestions: ${review.output}`,
  { sessionId: generated.sessionId } // Resume session
);
```

## Structured Output with JSON Parsing

Extract and validate JSON responses from AI CLI tools with optional Zod schema validation.

### Basic JSON Extraction

Extract JSON without validation:

```typescript
const response = await claude.execute(
  'Return a JSON object with keys: name, age, city',
  { responseSchema: true } // Auto-extract JSON without validation
);

console.log(response.output); // Parsed JSON object
console.log(response.raw.stdout); // Original text with JSON
```

### Type-Safe Validation with Zod

Define and validate expected structure:

```typescript
import { z } from 'zod';

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

### Complex Nested Schemas

```typescript
const WeatherSchema = z.object({
  location: z.object({
    city: z.string(),
    country: z.string(),
  }),
  temperature: z.number(),
  conditions: z.string(),
  forecast: z.array(
    z.object({
      day: z.string(),
      high: z.number(),
      low: z.number(),
    })
  ),
});

const response = await claude.execute(
  'Return weather data for San Francisco with 3-day forecast',
  { responseSchema: WeatherSchema }
);
```

### Array Validation

```typescript
const TaskSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

const TaskListSchema = z.array(TaskSchema);

const response = await claude.execute(
  'Return a JSON array of tasks',
  { responseSchema: TaskListSchema }
);

// response.output is typed as Array<{ id: number; title: string; completed: boolean }>
```

### Key Features

- **Automatic JSON Extraction**: Parses JSON from markdown code blocks or inline
- **Optional Validation**: Use `true` for extraction only, or provide Zod schema
- **Type Safety**: TypeScript infers output type from Zod schema
- **Graceful Failures**: Returns best-effort data even if validation fails
- **Original Text Preserved**: Access raw output via `response.raw.stdout`
- **Validation Metadata**: Check `response.metadata.validation` for results

### Example: Complete Workflow

```typescript
import { createClaudeAdapter } from '@sourceborn/agent-cli-sdk';
import { z } from 'zod';

const claude = createClaudeAdapter();

// Define schema
const AnalysisSchema = z.object({
  summary: z.string(),
  issues: z.array(
    z.object({
      severity: z.enum(['low', 'medium', 'high']),
      description: z.string(),
      line: z.number().optional(),
    })
  ),
  recommendations: z.array(z.string()),
});

// Execute with validation
const response = await claude.execute(
  'Analyze this code and return structured JSON with summary, issues, and recommendations',
  { responseSchema: AnalysisSchema }
);

// Type-safe access
if (response.metadata.validation?.success) {
  console.log(`Found ${response.output.issues.length} issues`);
  response.output.issues.forEach((issue) => {
    console.log(`[${issue.severity}] ${issue.description}`);
  });
}
```

See `examples/structured-output.ts` for more examples.

## API Reference

### Factory Functions

#### `createClaudeAdapter(config?)`

Creates a Claude Code adapter instance.

**Parameters:**

- `config?: ClaudeConfig` - Optional configuration

**Returns:** `ClaudeAdapter`

**Example:**

```typescript
const claude = createClaudeAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY, // Optional
});
```

#### `createCodexAdapter(config?)`

Creates a Codex adapter instance.

**Parameters:**

- `config?: CodexConfig` - Optional configuration

**Returns:** `CodexAdapter`

**Example:**

```typescript
const codex = createCodexAdapter({
  apiKey: process.env.CODEX_API_KEY, // Optional
});
```

### Adapter Methods

#### `execute(prompt, options?)`

Execute a prompt with the AI adapter.

**Parameters:**

- `prompt: string` - The prompt/instruction
- `options?: ExecutionOptions` - Execution options

**Returns:** `Promise<ExecutionResponse>`

**Common Options:**

- `streaming?: boolean` - Enable streaming mode
- `onStream?: (event: StreamEvent) => void` - Streaming callback
- `timeout?: number` - Timeout in milliseconds
- `sessionId?: string` - Resume a previous session (Claude only)
- `responseSchema?: any | true` - Extract/validate JSON (pass `true` for extraction only, or Zod schema for validation)

**Claude-Specific Options:**

- `model?: string` - Model to use (default: 'sonnet')
- `permissionMode?: string` - Permission mode ('acceptEdits', 'bypassPermissions', etc.)
- `systemPrompt?: string` - Custom system prompt
- `fallbackModel?: string` - Fallback model if primary is overloaded

**Codex-Specific Options:**

- `model?: string` - Model to use (default: 'gpt-5')
- `fullAuto?: boolean` - Enable full-auto mode
- `sandbox?: string` - Sandbox mode ('read-only', 'workspace-write', 'danger-full-access')
- `approvalPolicy?: string` - Approval policy ('untrusted', 'on-failure', 'on-request', 'never')
- `enableSearch?: boolean` - Enable web search
- `images?: string[]` - Image file paths for multi-modal input

#### `getCapabilities()`

Get the capabilities supported by this adapter.

**Returns:** `AdapterCapabilities`

```typescript
const caps = claude.getCapabilities();
console.log(caps.streaming); // true
console.log(caps.sessionManagement); // true
console.log(caps.toolCalling); // true
console.log(caps.multiModal); // false
```

### Workflow Utilities

#### `sequential(operations)`

Execute operations sequentially.

```typescript
import { sequential } from '@sourceborn/agent-cli-sdk';

const results = await sequential([
  () => claude.execute('Task 1'),
  () => claude.execute('Task 2'),
  () => claude.execute('Task 3'),
]);
```

#### `parallel(operations)`

Execute operations in parallel.

```typescript
import { parallel } from '@sourceborn/agent-cli-sdk';

const results = await parallel([
  () => claude.execute('Task 1'),
  () => codex.execute('Task 2'),
  () => claude.execute('Task 3'),
]);
```

#### `retry(operation, options?)`

Retry an operation with exponential backoff.

```typescript
import { retry } from '@sourceborn/agent-cli-sdk';

const result = await retry(() => claude.execute('Generate code'), {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
});
```

## Configuration

### Environment Variables

#### CLI Path Overrides

- `CLAUDE_CLI_PATH` - Custom path to Claude CLI binary
- `CODEX_CLI_PATH` - Custom path to Codex CLI binary

#### Authentication (Optional)

- `ANTHROPIC_API_KEY` - Claude API key (alternative to OAuth)
- `CLAUDE_CODE_OAUTH_TOKEN` - Claude OAuth token
- `CODEX_API_KEY` - Codex API key (alternative to OAuth)

### Authentication

**Claude:** Run `claude setup-token` or set `ANTHROPIC_API_KEY`

**Codex:** Run `codex login` or set `CODEX_API_KEY`

## Error Handling

The SDK provides standardized error types:

```typescript
import {
  AuthenticationError,
  CLINotFoundError,
  TimeoutError,
  ExecutionError,
} from '@sourceborn/agent-cli-sdk';

try {
  const response = await claude.execute('Task');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Not authenticated:', error.recovery);
  } else if (error instanceof CLINotFoundError) {
    console.error('CLI not found:', error.recovery);
  } else if (error instanceof TimeoutError) {
    console.error('Timed out. Session:', error.sessionId);
    console.error('Partial output:', error.partialOutput);
  }
}
```

## Examples

See the `examples/` directory for complete examples:

- `examples/simple.ts` - Basic single-agent usage
- `examples/multi-agent.ts` - Multi-agent workflow
- `examples/ci-integration.ts` - CI/CD pipeline integration
- `examples/structured-output.ts` - JSON extraction and validation

Run examples:

```bash
npx tsx examples/simple.ts
npx tsx examples/multi-agent.ts
npx tsx examples/ci-integration.ts src/index.ts
npx tsx examples/structured-output.ts
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Application Layer               │
│    (Your code using the SDK)            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         SDK Layer                       │
│  ┌──────────────┐   ┌──────────────┐   │
│  │   Claude     │   │    Codex     │   │
│  │   Adapter    │   │   Adapter    │   │
│  └──────┬───────┘   └──────┬───────┘   │
│         │                   │           │
│  ┌──────▼───────────────────▼───────┐   │
│  │    Common Adapter Interface     │   │
│  │  (execute, getCapabilities)     │   │
│  └──────────────────────────────────┘   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         CLI Layer                       │
│  ┌──────────────┐   ┌──────────────┐   │
│  │  claude CLI  │   │  codex CLI   │   │
│  │  (--print    │   │  (exec       │   │
│  │   --json)    │   │   --json)    │   │
│  └──────────────┘   └──────────────┘   │
└─────────────────────────────────────────┘
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Format
pnpm format
```

## Validations

```bash
pnpm check
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [Documentation](https://github.com/sourceborn/agent-cli-sdk#readme)
- [Issues](https://github.com/sourceborn/agent-cli-sdk/issues)
- [Claude Code](https://claude.ai/download)
- [Codex](https://codex.openai.com)
