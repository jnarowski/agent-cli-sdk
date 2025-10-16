# Feature: Project Initialization & SDK Foundation

## What We're Building

A complete TypeScript SDK project structure with core interfaces, Claude Code and Codex adapters, configuration management, and comprehensive testing setup. This establishes the foundation for orchestrating multiple AI CLI tools through a unified programmatic interface.

## User Story

As a developer
I want to use a standardized SDK to orchestrate Claude Code and Codex programmatically
So that I can build automated multi-agent development workflows without managing tool-specific integration complexity

## Technical Approach

We'll build an adapter pattern inspired by Vercel AI SDK, with a common interface that both Claude Code and Codex adapters implement. Both adapters will use Node.js `child_process` to invoke their respective CLIs - the Claude adapter will use `--print` mode with `--output-format json` for structured output, while the Codex adapter will use the `exec` subcommand for non-interactive execution. We'll include factory patterns for easy instantiation, comprehensive TypeScript types for full type safety, and example workflows to demonstrate usage patterns. Build tooling will use `tsc` for compilation and `tsx` for development and running examples.

## Files to Touch

### Existing Files

- `package.json` - Add dependencies, update scripts, add exports configuration
- `.gitignore` - Add build artifacts, environment files, and IDE configurations
- `tsconfig.json` - Create TypeScript configuration for the project

### New Files

- `src/index.ts` - Main entry point, exports public API
- `src/core/interfaces.ts` - Common adapter interface definitions
- `src/core/base-adapter.ts` - Base adapter class with shared functionality
- `src/core/errors.ts` - Standardized error types
- `src/types/index.ts` - TypeScript type definitions and exports
- `src/types/claude.ts` - Claude-specific types
- `src/types/codex.ts` - Codex-specific types
- `src/types/config.ts` - Configuration types
- `src/adapters/claude/index.ts` - Claude Code adapter implementation
- `src/adapters/claude/cli-wrapper.ts` - Child process wrapper for Claude CLI
- `src/adapters/claude/parser.ts` - Parse Claude CLI JSON output
- `src/adapters/codex/index.ts` - Codex adapter implementation
- `src/adapters/codex/cli-wrapper.ts` - Child process wrapper for Codex CLI
- `src/adapters/codex/parser.ts` - Parse Codex CLI output
- `src/utils/factory.ts` - Factory functions for creating adapters
- `src/utils/async.ts` - Async helper utilities for workflow composition
- `src/utils/validation.ts` - Configuration and input validation
- `src/utils/cli-detector.ts` - Cross-platform CLI binary detection in PATH
- `examples/simple.ts` - Basic single-agent example
- `examples/multi-agent.ts` - Multi-agent workflow example
- `examples/ci-integration.ts` - CI/CD pipeline integration example
- `tests/unit/adapters/claude.test.ts` - Claude adapter unit tests (mocked)
- `tests/unit/adapters/codex.test.ts` - Codex adapter unit tests (mocked)
- `tests/unit/utils/*.test.ts` - Utility function unit tests
- `tests/e2e/smoke.test.ts` - E2E smoke tests with real CLIs (optional)
- `tests/setup.ts` - Test configuration and setup
- `tests/fixtures/claude-*.json` - Sample Claude CLI outputs for testing
- `tests/fixtures/codex-*.jsonl` - Sample Codex CLI event streams for testing
- `.env.example` - Example environment configuration
- `README.md` - Documentation with quickstart and API reference
- `LICENSE` - MIT license file
- `CONTRIBUTING.md` - Contribution guidelines

## Implementation Plan

### Phase 1: Foundation

Set up the project structure, TypeScript configuration, build tooling, and core type definitions. Install dependencies and establish the development environment with linting, formatting, and testing infrastructure.

### Phase 2: Core Implementation

Implement the adapter interface, base adapter class, error handling system, and both Claude Code and Codex adapters. Build CLI wrappers for both tools using `child_process`, implement parsing logic for their respective output formats. Create factory functions and async utilities for workflow composition.

### Phase 3: Integration

Add example workflows demonstrating single-agent, multi-agent, and CI/CD integration patterns. Write comprehensive tests (unit and integration), create documentation, and prepare the package for npm publishing.

## Step by Step Tasks

### 1: Project Structure Setup

<!-- prettier-ignore -->
- [x] 1.1 Create source directory structure
        - Create `src/`, `src/core/`, `src/adapters/`, `src/adapters/claude/`, `src/adapters/codex/`, `src/types/`, `src/utils/`
        - Create `examples/`, `tests/`, `tests/unit/`, `tests/unit/adapters/`, `tests/unit/utils/`, `tests/e2e/`, `tests/fixtures/`
        - Command: `mkdir -p src/core src/adapters/claude src/adapters/codex src/types src/utils examples tests/unit/adapters tests/unit/utils tests/e2e tests/fixtures`
- [x] 1.2 Update .gitignore with build artifacts and configurations
        - Add: `dist/`, `node_modules/`, `.env`, `*.log`, `.DS_Store`, coverage reports, IDE configs
        - File: `.gitignore`
- [x] 1.3 Create TypeScript configuration
        - Target: ES2022, module: NodeNext, strict mode enabled
        - Output to `dist/`, include `src/**/*`, exclude tests
        - Declaration files enabled for type definitions
        - File: `tsconfig.json`
- [x] 1.4 Update package.json with dependencies and scripts
        - Add dev dependencies: `@types/node`, TypeScript, ESLint, Prettier, Vitest, `tsx`
        - Remove `openai` SDK dependency (using Codex CLI instead)
        - Update scripts: `build: tsc`, `dev: tsx watch src/index.ts`, `test: vitest`
        - Update exports field for dual CJS/ESM support
        - File: `package.json`
- [x] 1.5 Install dependencies
        - Command: `npm install`
        - Expected: All packages installed successfully

#### Completion Notes

**Phase 1 Complete:**
- ✅ Created full directory structure: src/{core,adapters/{claude,codex},types,utils}, examples, tests/{unit/{adapters,utils},e2e,fixtures}
- ✅ Updated .gitignore with build artifacts, dependencies, environment files, logs, OS files, IDE configs, coverage reports
- ✅ Created tsconfig.json with ES2022 target, NodeNext modules, strict mode, declaration files enabled
- ✅ Updated package.json: removed openai dependency (using CLI instead), added tsx for dev, configured ES modules with exports field
- ✅ Installed all dependencies successfully (181 packages)

### 2: Core Types and Interfaces

<!-- prettier-ignore -->
- [x] 2.1 Define common adapter interface
        - Interface: `AIAdapter` with primary method: `execute(prompt: string, options?: ExecutionOptions)`
        - All methods return `Promise<AdapterResponse>`
        - Include `getCapabilities()` method for feature detection
        - Support both streaming and non-streaming modes
        - File: `src/core/interfaces.ts`
        - Example structure:
        ```typescript
        interface AIAdapter {
          execute(prompt: string, options?: ExecutionOptions): Promise<AdapterResponse>;
          getCapabilities(): AdapterCapabilities;
        }

        interface AdapterCapabilities {
          streaming: boolean;
          sessionManagement: boolean;
          toolCalling: boolean;
          multiModal: boolean;
        }
        ```
- [x] 2.2 Create base adapter class
        - Abstract class implementing `AIAdapter`
        - Shared error handling, logging, validation logic
        - Protected methods for common operations
        - File: `src/core/base-adapter.ts`
- [x] 2.3 Define standardized error types
        - `AdapterError` base class extending Error
        - Specific errors: `ConfigurationError`, `ExecutionError`, `ValidationError`, `TimeoutError`
        - `AuthenticationError` - CLI not authenticated (throw with setup instructions)
        - `CLINotFoundError` - CLI binary not in PATH (throw with installation guide)
        - `ModelOverloadError` - Model capacity exceeded (auto-retry with fallback if configured)
        - `PermissionDeniedError` - User/sandbox denied operation (throw with permission guidance)
        - Include error codes, helpful messages, and recovery suggestions
        - Timeout errors include partial results and session ID for resuming
        - File: `src/core/errors.ts`
        - Example structure:
        ```typescript
        class AdapterError extends Error {
          code: string;
          details?: any;
          recovery?: string;  // Suggestion for user
        }

        class AuthenticationError extends AdapterError {
          constructor(adapter: 'claude' | 'codex') {
            super(`${adapter} CLI is not authenticated`);
            this.code = 'AUTH_REQUIRED';
            this.recovery = adapter === 'claude'
              ? 'Run: claude setup-token'
              : 'Run: codex login';
          }
        }

        class TimeoutError extends AdapterError {
          sessionId?: string;
          partialOutput?: string;

          constructor(message: string, sessionId?: string, partialOutput?: string) {
            super(message);
            this.code = 'TIMEOUT';
            this.sessionId = sessionId;
            this.partialOutput = partialOutput;
            this.recovery = sessionId
              ? `Resume with: execute(prompt, { sessionId: '${sessionId}' })`
              : undefined;
          }
        }
        ```
- [x] 2.4 Create TypeScript type definitions
        - `AdapterResponse`, `AdapterConfig`, `ExecutionOptions`, `StreamEvent`, `ActionLog` types
        - Support for both streaming and complete response modes
        - File: `src/types/config.ts`
        - Example structure:
        ```typescript
        interface AdapterResponse {
          output: string;              // Final text response
          sessionId: string;           // For resuming
          status: 'success' | 'error' | 'timeout';
          exitCode: number;
          duration: number;            // milliseconds
          actions?: ActionLog[];       // Array of tool calls/operations
          metadata: {
            model?: string;
            tokensUsed?: number;
            toolsUsed?: string[];
            filesModified?: string[];
          };
          raw?: {
            stdout: string;
            stderr: string;
            events?: StreamEvent[];    // All stream events if streaming was enabled
          };
          error?: {
            code: string;
            message: string;
            details?: any;
          };
        }

        interface StreamEvent {
          type: 'turn.started' | 'turn.completed' | 'turn.failed' |
                'tool.started' | 'tool.completed' | 'message.chunk' |
                'item.started' | 'item.updated' | 'item.completed';
          timestamp: number;
          data: {
            content?: string;          // Partial message content
            toolName?: string;         // Tool being executed (Read, Edit, Bash, etc.)
            metadata?: Record<string, any>;
          };
        }

        interface ActionLog {
          timestamp: number;
          type: 'read' | 'write' | 'edit' | 'bash' | 'search' | 'think';
          target?: string;             // File path, command, etc.
          content?: string;            // What was done
          result?: 'success' | 'error';
          metadata?: Record<string, any>;
        }

        interface ExecutionOptions {
          streaming?: boolean;
          onStream?: (event: StreamEvent) => void;
          sessionId?: string;          // For resuming sessions
          timeout?: number;
          // CLI-specific options passed through
          [key: string]: any;
        }
        ```
- [x] 2.5 Create Claude-specific types
        - `ClaudeConfig`, `ClaudeResponse`, `ClaudeExecutionOptions`
        - CLI mode types: `print`, `stream`, `interactive`
        - Default model: `claude-sonnet-4-5` (latest Sonnet)
        - Authentication: Prioritize `ANTHROPIC_API_KEY` env var, fallback to OAuth via `claude setup-token`
        - Support `CLAUDE_CODE_OAUTH_TOKEN` for long-lived tokens
        - File: `src/types/claude.ts`
        - Example:
        ```typescript
        interface ClaudeConfig {
          // Authentication (optional - defaults to CLI OAuth)
          apiKey?: string;  // From ANTHROPIC_API_KEY env var
          oauthToken?: string;  // From CLAUDE_CODE_OAUTH_TOKEN env var
        }

        interface ClaudeExecutionOptions extends ExecutionOptions {
          model?: string;  // Default: 'sonnet' (claude-sonnet-4-5)
          outputFormat?: 'text' | 'json' | 'stream-json';
          permissionMode?: 'acceptEdits' | 'bypassPermissions' | 'default' | 'plan';
          systemPrompt?: string;
          appendSystemPrompt?: string;
          allowedTools?: string[];
          disallowedTools?: string[];
        }
        ```
- [x] 2.6 Create Codex-specific types
        - `CodexConfig`, `CodexResponse`, `CodexExecutionOptions`
        - Model types, sandbox modes, and approval policies
        - Default model: `gpt-5` (equivalent to Claude Sonnet 4.5)
        - Authentication: Prioritize OAuth via `codex login`, support API key fallback
        - File: `src/types/codex.ts`
        - Example:
        ```typescript
        interface CodexConfig {
          // Authentication (optional - defaults to OAuth from codex login)
          apiKey?: string;  // For API key authentication
        }

        interface CodexExecutionOptions extends ExecutionOptions {
          model?: string;  // Default: 'gpt-5'
          workingDirectory?: string;  // -C flag
          sandbox?: 'read-only' | 'workspace-write' | 'danger-full-access';
          approvalPolicy?: 'untrusted' | 'on-failure' | 'on-request' | 'never';
          fullAuto?: boolean;  // Convenience for: sandbox=workspace-write, approval=on-failure
          enableSearch?: boolean;  // --search flag
          images?: string[];  // -i flag for image inputs
          configOverrides?: Record<string, any>;  // -c flag
          profile?: string;  // -p flag
        }
        ```
- [x] 2.7 Create main types export file
        - Re-export all types from a single entry point
        - File: `src/types/index.ts`

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 3: Claude Code Adapter

**Reference:** See `.agent/docs/claude.md` for complete CLI options and usage patterns

<!-- prettier-ignore -->
- [x] 3.1 Implement CLI wrapper for child_process execution
        - Function to spawn `claude` command with arguments
        - Support for `--print` mode for JSON output (required for programmatic usage)
        - Support for `--output-format json` (complete response) and `--output-format stream-json` (real-time streaming)
        - Support for `--include-partial-messages` for streaming mode
        - Support for `--model`, `--system-prompt`, `--append-system-prompt` options
        - Support for `--permission-mode` and tool permission options
        - Handle stdout/stderr streams and parse JSONL events
        - Timeout and cancellation support
        - File: `src/adapters/claude/cli-wrapper.ts`
        - Reference: `.agent/docs/claude.md` lines 19-113
- [x] 3.2 Implement Claude CLI output parser
        - Parse JSON responses from `--print --output-format json` mode
        - Parse streaming JSONL from `--output-format stream-json` mode
        - Extract tool calls (Read, Edit, Bash, etc.) and convert to ActionLog format
        - Extract code blocks, file changes, and execution results
        - Parse stream events and normalize to StreamEvent interface
        - Error response parsing
        - Track files modified and tools used for metadata
        - File: `src/adapters/claude/parser.ts`
- [x] 3.3 Build Claude adapter class
        - Extend `BaseAdapter` and implement `AIAdapter` interface
        - Implement `execute(prompt, options)` with streaming support
        - Handle `options.streaming` to toggle between json and stream-json output formats
        - Call `options.onStream(event)` callback for real-time events
        - Support session management via `options.sessionId` or `--continue`/`--resume` flags
        - Configuration validation
        - Return complete AdapterResponse with actions, metadata, and raw events
        - File: `src/adapters/claude/index.ts`
        - Reference: `.agent/docs/claude.md` lines 125-152
        - Example usage:
        ```typescript
        const response = await claudeAdapter.execute("Fix the bug in auth.ts", {
          streaming: true,
          onStream: (event) => {
            if (event.type === 'tool.started') {
              console.log(`🔧 Using ${event.data.toolName}...`);
            }
            if (event.type === 'message.chunk') {
              process.stdout.write(event.data.content);
            }
          }
        });

        console.log(`Session: ${response.sessionId}`);
        console.log(`Actions: ${response.actions?.length}`);
        console.log(`Files: ${response.metadata.filesModified}`);
        ```
- [x] 3.4 Add Claude adapter error handling
        - Catch CLI errors and convert to standardized errors
        - Handle CLI not found, authentication errors
        - Retry logic for transient failures
        - Support for `--fallback-model` on overload errors
        - File: `src/adapters/claude/index.ts`

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 4: Codex Adapter

**Reference:** See `.agent/docs/codex.md` for complete CLI options and usage patterns

<!-- prettier-ignore -->
- [x] 4.1 Implement CLI wrapper for Codex execution
        - Function to spawn `codex exec` command with arguments
        - Support for non-interactive execution via `exec` subcommand
        - Support for `--json` flag for JSONL event streaming
        - Support for `-m, --model` option for model selection
        - Support for `-C, --cd` for working directory
        - Support for `-s, --sandbox` and `-a, --ask-for-approval` permission options
        - Support for `--full-auto` mode for automated workflows
        - Support for `-c, --config` for configuration overrides
        - Support for `--search` flag for web search capability
        - Support for `-i, --image` for image inputs
        - Handle stdout/stderr streams and parse JSONL events
        - Timeout and cancellation support
        - File: `src/adapters/codex/cli-wrapper.ts`
        - Reference: `.agent/docs/codex.md` lines 34-94
- [x] 4.2 Implement Codex CLI output parser
        - Parse JSONL event stream from `--json` mode
        - Parse turn.started, turn.completed, turn.failed events
        - Parse item.started, item.updated, item.completed events
        - Extract code, diffs, and execution results from events
        - Convert Codex events to unified StreamEvent interface
        - Extract actions/operations and convert to ActionLog format
        - Handle sandbox-specific outputs
        - Track files modified and operations performed
        - Error response parsing
        - File: `src/adapters/codex/parser.ts`
- [x] 4.3 Build Codex adapter class
        - Extend `BaseAdapter` and implement `AIAdapter` interface
        - Implement `execute(prompt, options)` with streaming support
        - Handle `options.streaming` to enable `--json` flag for event streaming
        - Call `options.onStream(event)` callback for real-time JSONL events
        - Support for configuration profiles via `-p, --profile`
        - Configuration validation (check for authentication via `codex login`)
        - Return complete AdapterResponse with actions, metadata, and raw events
        - Access session logs from `$CODEX_HOME/sessions/` for forensics
        - File: `src/adapters/codex/index.ts`
        - Reference: `.agent/docs/codex.md` lines 95-132
        - Example usage:
        ```typescript
        const response = await codexAdapter.execute("Review this code for security issues", {
          streaming: true,
          sandbox: 'workspace-write',
          fullAuto: true,
          onStream: (event) => {
            if (event.type === 'turn.started') {
              console.log('🚀 Starting analysis...');
            }
            if (event.type === 'message.chunk') {
              process.stdout.write(event.data.content);
            }
          }
        });

        console.log(`Duration: ${response.duration}ms`);
        console.log(`Actions: ${response.actions?.length}`);
        ```
- [x] 4.4 Add Codex adapter error handling
        - Catch CLI errors and convert to standardized errors
        - Handle CLI not found, authentication errors (not logged in)
        - Handle sandbox permission errors
        - Retry logic for transient failures
        - File: `src/adapters/codex/index.ts`
        - Reference: `.agent/docs/codex.md` lines 134-145
- [x] 4.5 Update directory structure for Codex
        - Create `src/adapters/codex/` directory
        - Update task 1.1 to include `src/adapters/codex/`
        - Create `tests/unit/adapters/codex.test.ts` for Codex tests
        - File: Directory structure

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 5: Utilities and Factory

<!-- prettier-ignore -->
- [x] 5.1 Create adapter factory functions
        - `createClaudeAdapter(config?)` factory - minimal config, checks CLI availability
        - `createCodexAdapter(config?)` factory - minimal config, checks CLI availability
        - Use `findCLI()` utility to auto-detect CLI binaries in PATH
        - Support `CLAUDE_CLI_PATH` and `CODEX_CLI_PATH` env var overrides
        - Check authentication status and provide helpful errors
        - Detect and warn if both OAuth and API token are available
        - File: `src/utils/factory.ts`
        - Example:
        ```typescript
        import { findCLI } from './cli-detector';

        export function createClaudeAdapter(config?: ClaudeConfig) {
          // 1. Find Claude CLI binary (auto-detect or use CLAUDE_CLI_PATH)
          const cliPath = findCLI('claude');
          if (!cliPath) {
            throw new CLINotFoundError('claude',
              'Claude CLI not found in PATH. Install: https://claude.ai/download\n' +
              'Or set CLAUDE_CLI_PATH=/path/to/claude'
            );
          }

          // 2. Check authentication (OAuth or API key)
          // 3. Warn if multiple auth methods detected
          // 4. Return adapter instance with CLI path

          return new ClaudeAdapter(cliPath, config);
        }

        // Simple usage - auto-detects everything
        const claude = createClaudeAdapter();
        const codex = createCodexAdapter();

        // With custom CLI path via environment variable:
        // CLAUDE_CLI_PATH=/custom/path/to/claude
        // CODEX_CLI_PATH=/custom/path/to/codex
        ```
- [x] 5.2 Implement async workflow utilities
        - `sequential()` - run operations in sequence
        - `parallel()` - run operations concurrently
        - `waterfall()` - pass results between operations
        - `retry()` - retry failed operations
        - File: `src/utils/async.ts`
- [x] 5.3 Create CLI detection utility
        - Cross-platform binary detection in PATH
        - Use `which` on Unix/macOS, `where` on Windows
        - Support optional environment variable overrides
        - `CLAUDE_CLI_PATH` - Override path to Claude CLI binary
        - `CODEX_CLI_PATH` - Override path to Codex CLI binary
        - Return full path to binary or null if not found
        - File: `src/utils/cli-detector.ts`
        - Example:
        ```typescript
        import { execSync } from 'child_process';

        export function findCLI(command: 'claude' | 'codex'): string | null {
          // 1. Check environment variable override first
          const envVar = command === 'claude' ? 'CLAUDE_CLI_PATH' : 'CODEX_CLI_PATH';
          const envPath = process.env[envVar];
          if (envPath) {
            return envPath; // User-specified path takes priority
          }

          // 2. Auto-detect in PATH
          try {
            const whichCommand = process.platform === 'win32' ? 'where' : 'which';
            const path = execSync(`${whichCommand} ${command}`, { encoding: 'utf8' }).trim();
            return path.split('\n')[0]; // Return first match
          } catch {
            return null; // Not found in PATH
          }
        }
        ```
- [x] 5.4 Create validation utilities
        - Config validation functions
        - Input sanitization
        - Environment variable helpers
        - File: `src/utils/validation.ts`

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 6: Main Entry Point and Exports

<!-- prettier-ignore -->
- [x] 6.1 Create main index file
        - Export all adapters
        - Export factory functions
        - Export types and interfaces
        - Export utilities
        - File: `src/index.ts`
- [x] 6.2 Verify build output
        - Command: `npm run build`
        - Expected: Clean build with no errors, dist/ populated with .js and .d.ts files

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 7: Example Workflows

<!-- prettier-ignore -->
- [x] 7.1 Create simple single-agent example
        - Demonstrate basic Claude adapter usage
        - Generate a simple function
        - Show error handling
        - File: `examples/simple.ts`
- [x] 7.2 Create multi-agent workflow example
        - Claude generates code with streaming
        - OpenAI Codex reviews the code
        - Claude applies review feedback
        - Demonstrates passing output between adapters
        - Shows session management and resuming
        - File: `examples/multi-agent.ts`
        - Example structure:
        ```typescript
        import { createClaudeAdapter, createCodexAdapter } from '@sourceborn/agent-cli-sdk';

        async function multiAgentWorkflow() {
          const claude = createClaudeAdapter();
          const codex = createCodexAdapter();

          // Step 1: Claude generates code
          console.log('Step 1: Generating code with Claude...');
          const generated = await claude.execute(
            'Create a function to validate email addresses',
            {
              streaming: true,
              onStream: (e) => {
                if (e.type === 'message.chunk') process.stdout.write(e.data.content);
              }
            }
          );

          console.log(`\n✓ Generated (Session: ${generated.sessionId})`);
          console.log(`Files modified: ${generated.metadata.filesModified}`);

          // Step 2: Codex reviews the code
          console.log('\nStep 2: Reviewing with Codex...');
          const review = await codex.execute(
            'Review the email validation function for security and edge cases',
            { fullAuto: true }
          );

          console.log(`✓ Review complete`);
          console.log(review.output);

          // Step 3: Claude applies feedback
          console.log('\nStep 3: Applying feedback with Claude...');
          const fixed = await claude.execute(
            `Apply this review feedback: ${review.output}`,
            { sessionId: generated.sessionId }  // Resume previous session
          );

          console.log(`✓ Fixed (Session: ${fixed.sessionId})`);
          console.log(`Total actions: ${fixed.actions?.length}`);
        }

        multiAgentWorkflow().catch(console.error);
        ```
- [x] 7.3 Create CI/CD integration example
        - Automated code review in CI pipeline
        - Generate test cases for new code
        - Integration with GitHub Actions or similar
        - File: `examples/ci-integration.ts`
- [x] 7.4 Add example environment configuration
        - Document all optional environment variables
        - File: `.env.example`
        - Example content:
        ```bash
        # Optional: Override CLI binary paths (auto-detected by default)
        # CLAUDE_CLI_PATH=/custom/path/to/claude
        # CODEX_CLI_PATH=/custom/path/to/codex

        # Optional: API token authentication (OAuth via CLI is default)
        # ANTHROPIC_API_KEY=sk-ant-...
        # CLAUDE_CODE_OAUTH_TOKEN=...

        # Optional: Codex API key (OAuth via 'codex login' is default)
        # CODEX_API_KEY=...

        # Optional: Enable E2E tests with real CLIs
        # RUN_E2E_TESTS=true
        ```

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 8: Testing Infrastructure

<!-- prettier-ignore -->
- [ ] 8.1 Create test setup and configuration
        - Configure Vitest
        - Set up test environment variables
        - Mock utilities for child_process
        - Create fixture data from real CLI outputs (JSON/JSONL samples)
        - File: `tests/setup.ts`
        - File: `tests/fixtures/claude-*.json` - Sample Claude CLI outputs
        - File: `tests/fixtures/codex-*.jsonl` - Sample Codex CLI event streams
- [ ] 8.2 Write Claude adapter unit tests (mocked)
        - Mock child_process.spawn to return fixture data
        - Test CLI wrapper execution with various options
        - Test output parsing for both json and stream-json formats
        - Test error handling (CLI not found, auth errors, timeouts)
        - Test session management and resuming
        - Test stream event parsing and callback invocation
        - Target: >80% code coverage
        - File: `tests/unit/adapters/claude.test.ts`
- [ ] 8.3 Write Codex adapter unit tests (mocked)
        - Mock child_process.spawn to return fixture data
        - Test CLI wrapper execution with various options
        - Test JSONL event stream parsing
        - Test error handling (not logged in, sandbox errors)
        - Test sandbox and permission configurations
        - Test action log extraction from events
        - Target: >80% code coverage
        - File: `tests/unit/adapters/codex.test.ts`
- [ ] 8.4 Write core utilities unit tests
        - Test factory functions (CLI detection, auth validation)
        - Test async workflow utilities (sequential, parallel, waterfall, retry)
        - Test error classes and recovery suggestions
        - File: `tests/unit/utils/*.test.ts`
- [ ] 8.5 Create E2E smoke tests (real CLIs)
        - **Optional tests that call actual CLIs** (skipped by default)
        - Enable with: `RUN_E2E_TESTS=true npm test`
        - Test simple Claude execution with real CLI
        - Test simple Codex execution with real CLI
        - Test multi-agent workflow (Claude → Codex → Claude)
        - Test streaming with real-time events
        - Requires: CLIs installed and authenticated
        - File: `tests/e2e/smoke.test.ts`
        - Note: These tests help validate SDK works with real CLIs and aid development/debugging
- [ ] 8.6 Run test suite
        - Command: `npm test` (unit tests only, fast)
        - Command: `RUN_E2E_TESTS=true npm test` (includes E2E smoke tests)
        - Expected: All tests passing, >80% coverage on unit tests

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 9: Documentation

<!-- prettier-ignore -->
- [x] 9.1 Create comprehensive README
        - Project overview and features
        - Installation instructions
        - Quickstart guide
        - API reference for both adapters
        - Example usage snippets
        - Architecture diagram (ASCII or markdown)
        - Contributing guidelines link
        - File: `README.md`
- [x] 9.2 Add MIT license
        - Standard MIT license text
        - Copyright: Sourceborn
        - File: `LICENSE`
- [x] 9.3 Create contributing guidelines
        - Development setup instructions
        - Code style and conventions
        - PR process
        - Testing requirements
        - File: `CONTRIBUTING.md`

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 10: Package Preparation

<!-- prettier-ignore -->
- [x] 10.1 Configure package.json for publishing
        - Verify name, version, description
        - Set repository URL
        - Add keywords for npm search
        - Configure files to include in package
        - Set engines requirement (node >=22.0.0)
        - File: `package.json`
- [x] 10.2 Verify package contents
        - Command: `npm pack --dry-run`
        - Expected: Only necessary files included (dist/, package.json, README, LICENSE)
- [x] 10.3 Final build and lint check
        - Command: `npm run lint && npm run build`
        - Expected: No errors or warnings

#### Completion Notes

(This will be filled in by the agent implementing this phase)

## Acceptance Criteria

**Must Work:**

- [ ] Both Claude Code and Codex adapters implement the common `AIAdapter` interface
- [ ] Claude adapter successfully invokes Claude CLI using `child_process` with `--print` mode
- [ ] Codex adapter successfully invokes Codex CLI using `child_process` with `exec` subcommand
- [ ] Factory functions create properly configured adapter instances
- [ ] All example workflows execute without errors
- [ ] TypeScript compilation succeeds with no errors
- [ ] Unit tests achieve >80% code coverage
- [ ] Integration tests verify multi-agent workflows work end-to-end
- [ ] Package builds successfully and includes only necessary files

**Should Not:**

- [ ] Break when Claude CLI is not installed (graceful error with setup instructions)
- [ ] Expose API keys or secrets in logs or error messages
- [ ] Add more than 500ms overhead compared to direct CLI/API usage
- [ ] Require external state management or databases
- [ ] Fail silently - all errors must be properly typed and surfaced

## Validation

Execute these commands to verify the feature works correctly:

**Automated Verification:**

```bash
# Install dependencies
npm install
# Expected: All packages installed, no vulnerabilities

# Type checking
npx tsc --noEmit
# Expected: No type errors

# Linting
npm run lint
# Expected: No lint errors

# Build
npm run build
# Expected: dist/ directory created with .js and .d.ts files

# Unit tests
npm test
# Expected: All tests passing, coverage >80%

# Package verification
npm pack --dry-run
# Expected: Package includes dist/, README.md, LICENSE, package.json
```

**Manual Verification:**

1. Check TypeScript types: Open `src/index.ts` in an IDE and verify full autocomplete works
2. Run simple example: `npx tsx examples/simple.ts`
3. Verify error handling: Run example with invalid config, check error message quality
4. Check adapter swapping: Modify multi-agent example to swap adapter order, verify it works
5. Verify documentation: Read README.md, ensure quickstart is clear and code examples work

**Feature-Specific Checks:**

- Verify Claude adapter detects when CLI is not installed and shows helpful error
- Verify Codex adapter detects when CLI is not installed/not logged in and shows helpful error
- Test async utilities: Run parallel and sequential operations, verify execution order
- Check factory auto-detection: Verify it correctly identifies available tools
- Verify type exports: Import types in a separate TypeScript file, ensure they're accessible

## Definition of Done

- [ ] All tasks completed
- [ ] Tests passing (>80% coverage)
- [ ] Lint and Type Checks passing
- [ ] Manual testing confirms both adapters work
- [ ] No console errors in examples
- [ ] Code follows adapter pattern consistently
- [ ] All public APIs have TypeScript type definitions
- [ ] Documentation is comprehensive and accurate
- [ ] Package is ready for npm publishing
- [ ] Examples demonstrate single-agent, multi-agent, and CI/CD patterns

## Notes

**Dependencies:**
- Requires Claude Code CLI to be installed and authenticated for Claude adapter functionality
  - CLI auto-detected in PATH or specify via `CLAUDE_CLI_PATH` environment variable
- Requires Codex CLI to be installed and authenticated (`codex login`) for Codex adapter functionality
  - CLI auto-detected in PATH or specify via `CODEX_CLI_PATH` environment variable
- Node.js 22+ required for modern ES modules and async features
- `tsx` for running examples during development
- No external dependencies for CLI detection (uses native `which`/`where` commands)

**Future Considerations:**
- Additional AI tool adapters (GitHub Copilot, Amazon CodeWhisperer, etc.)
- Built-in caching layer for repeated operations
- Workflow visualization and debugging tools
- Browser/edge runtime support (currently Node.js only)
- Advanced streaming features (pause/resume, backpressure handling)
- Workflow state persistence and replay capabilities
- Performance profiling and cost tracking per operation

**Architecture Notes:**
- Adapter pattern allows easy addition of new AI tools without changing core interfaces
- Factory pattern simplifies instantiation and configuration
- Async utilities enable complex workflow composition without callback hell
- Error standardization ensures consistent handling across all adapters
