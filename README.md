# Agent CLI SDK

TypeScript SDK for orchestrating AI-powered CLI tools (Claude Code, OpenAI Codex) in development workflows.

## Features

- **Unified Interface**: Common API for multiple AI CLI tools
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Streaming Support**: Real-time event streaming for both Claude and Codex
- **Session Management**: Resume and continue conversations (Claude)
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
```

Or with npm:

```bash
npm install @sourceborn/agent-cli-sdk
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

**Returns:** `Promise<AdapterResponse>`

**Common Options:**

- `streaming?: boolean` - Enable streaming mode
- `onStream?: (event: StreamEvent) => void` - Streaming callback
- `timeout?: number` - Timeout in milliseconds
- `sessionId?: string` - Resume a previous session (Claude only)

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

Run examples:

```bash
npx tsx examples/simple.ts
npx tsx examples/multi-agent.ts
npx tsx examples/ci-integration.ts src/index.ts
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
