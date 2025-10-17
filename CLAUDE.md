# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript SDK that provides a unified interface for orchestrating AI-powered CLI tools (Claude Code and OpenAI Codex). The SDK abstracts away CLI-specific details and provides a common API for executing prompts, streaming responses, and managing sessions.

## Essential Commands

### Development

```bash
pnpm install          # Install dependencies
pnpm build           # Build the project using tsdown
pnpm dev             # Watch mode for development
```

### Testing

```bash
pnpm test            # Run unit tests with vitest
pnpm test:watch      # Run tests in watch mode
vitest run path/to/test.test.ts  # Run a single test file
pnpm check-types     # Type check without emitting
pnpm check           # Run all validations (test + check-types + lint)
```

### Code Quality

```bash
pnpm lint            # Lint with ESLint
pnpm format          # Format with Prettier
```

### Running Examples

```bash
npx tsx examples/simple.ts           # Basic usage example
npx tsx examples/multi-agent.ts      # Multi-agent workflow
npx tsx examples/ci-integration.ts   # CI/CD integration
npx tsx examples/logging-workflow.ts # Logging demonstration
```

### E2E Testing

E2E tests require actual Claude and Codex CLIs to be installed and authenticated:

```bash
RUN_E2E_TESTS=true pnpm test:e2e
```

## Core Architecture

### Adapter Pattern

The SDK uses the **Adapter pattern** to provide a unified interface across different CLI tools:

```
AIAdapter (interface)
    ├── BaseAdapter (abstract class with shared functionality)
    │   ├── ClaudeAdapter (implements Claude Code CLI)
    │   └── CodexAdapter (implements Codex CLI)
```

Each adapter has three main components:

1. **index.ts**: Main adapter class extending BaseAdapter
2. **cli-wrapper.ts**: Spawns CLI processes and handles I/O
3. **parser.ts**: Parses CLI output (JSON/JSONL) into standardized responses

### Key Interfaces

- **AIAdapter** (`src/core/interfaces.ts`): Core interface with `execute()` and `getCapabilities()`
- **BaseAdapter** (`src/core/base-adapter.ts`): Abstract base with validation, session ID generation, and timing utilities
- **ExecutionOptions** (`src/types/config.ts`): Common options like streaming, timeout, onStream callback
- **AdapterResponse** (`src/types/config.ts`): Standardized response with output, sessionId, status, duration, actions, metadata

### CLI Interaction

**Claude CLI**:

- Always uses `-p` flag with `--output-format stream-json` and `--verbose`
- Uses `--setting-sources project` for consistent behavior
- Defaults to `--dangerously-skip-permissions` for better SDK UX
- Streams JSONL events: each line is a JSON object

**Codex CLI**:

- Uses `exec` command with `-q` and `--json` flags
- Supports multi-modal input via `-i` flag for images
- Has full-auto mode (`--full-auto`) and approval policies

### Output Parsing Strategy

Both parsers (`src/adapters/*/parser.ts`) implement a dual-parsing strategy:

1. First try parsing as single JSON object (for testing/fixtures)
2. If that fails, parse as JSONL (one JSON per line)
3. Extract session IDs, model info, tool calls, and file modifications from events

### Logging System

The SDK has a sophisticated dual logging system (`src/utils/logger.ts`):

**Two independent logging mechanisms:**

1. **Per-execution logging** (via `logPath` in `ExecutionOptions`):
   - Creates a directory with `input.json`, `output.json`, `stream.jsonl`
   - Works standalone without global configuration
   - Can use relative or absolute paths (absolute recommended)
   - Example: `await claude.execute(prompt, { logPath: './logs/agent-1' })`

2. **Central logging** (via `setLoggingConfig()`):
   - Single JSONL file appending all executions across the application
   - Optional - only writes if `setLoggingConfig({ centralLogPath })` was called
   - Absolute paths recommended (warnings issued for relative paths)
   - Example: `setLoggingConfig({ centralLogPath: path.resolve(cwd, 'logs/executions.jsonl') })`

**Best practices:**
- Use `path.resolve()` to create absolute paths
- Use workflow pattern for organization: `logs/workflow-{id}/agent-{n}-{name}`
- Logging failures never break execution (errors caught and logged to console)

## File Organization

```
src/
├── core/              # Core abstractions
│   ├── interfaces.ts  # AIAdapter, AdapterCapabilities
│   ├── base-adapter.ts # BaseAdapter with shared logic
│   └── errors.ts      # Custom error classes
├── adapters/
│   ├── claude/        # Claude Code adapter
│   │   ├── index.ts           # ClaudeAdapter class
│   │   ├── cli-wrapper.ts     # CLI process spawning
│   │   ├── parser.ts          # Output parsing
│   │   └── cli-detector.ts    # Auto-detect CLI path
│   └── codex/         # Codex adapter (same structure)
├── types/             # TypeScript definitions
│   ├── config.ts      # Common types
│   ├── claude.ts      # Claude-specific types
│   ├── codex.ts       # Codex-specific types
│   └── logging.ts     # Logging types
└── utils/             # Utilities
    ├── factory.ts         # createClaudeAdapter, createCodexAdapter
    ├── logger.ts          # Logging utilities
    ├── async.ts           # sequential, parallel, retry
    ├── validation.ts      # Input validation
    └── cli-detector.ts    # CLI binary detection
```

## Important Implementation Details

### CLI Detection

- Auto-detects CLI binaries in PATH using `which` command
- Respects environment variables: `CLAUDE_CLI_PATH`, `CODEX_CLI_PATH`
- Throws `CLINotFoundError` if CLI not found and no path provided

### Session Management

Claude supports resuming conversations via `sessionId`:

```typescript
const first = await claude.execute('Create a function');
const second = await claude.execute('Add tests', {
  sessionId: first.sessionId,
});
```

### Streaming

Streaming works by:

1. Setting `streaming: true` in options
2. Providing `onStream` callback
3. CLI wrapper calls callback with parsed JSONL events in real-time
4. Full response is still returned at the end

### Error Handling

Custom error types (`src/core/errors.ts`):

- **CLINotFoundError**: CLI binary not found
- **AuthenticationError**: Not authenticated (includes recovery instructions)
- **ValidationError**: Invalid input
- **ExecutionError**: CLI execution failed
- **TimeoutError**: Includes partial output and session ID for recovery

### Workflow Utilities

- **sequential**: Runs operations one after another
- **parallel**: Runs operations concurrently
- **retry**: Retries with exponential backoff

## Testing Strategy

- **Unit tests** (`tests/unit/`): Use mocks and fixtures, no real CLI required
- **E2E tests** (`tests/e2e/`): Require real CLIs installed, run with `RUN_E2E_TESTS=true`
- Test files mirror source structure
- Fixtures in `tests/fixtures/` contain sample CLI outputs

## TypeScript Configuration

- Target: ES2022 with ESNext modules
- Module resolution: Bundler (for optimal bundling)
- Strict mode enabled with additional checks (noUnusedLocals, noImplicitReturns)
- Declaration files generated for npm package

## Build Configuration

- Uses `tsdown` for building (successor to tsup)
- Outputs ESM format to `dist/`
- Package exports both JS and type definitions
- Main entry: `src/index.ts` exports all public APIs

## Publishing

```bash
pnpm ship  # Commits, bumps version, tags, pushes, and publishes
```

This runs: git add + commit + version patch + push + push tags + publish

## Working with This Codebase

When adding new features:

1. Add types in `src/types/` first
2. Implement in adapter-specific code if needed
3. Export from `src/index.ts`
4. Add unit tests with mocks
5. Add examples if it's a major feature
6. Update README.md

When debugging CLI issues:

- Use `verbose: true` in config to see CLI arguments and paths
- Check `raw.stderr` in response for CLI error messages
- Verify CLI authentication separately
- Test CLI commands manually first

When modifying parsers:

- Maintain backward compatibility with both JSON and JSONL formats
- Test with actual CLI output captured in fixtures
- Handle missing/unexpected fields gracefully
- Always normalize event types to standard format
