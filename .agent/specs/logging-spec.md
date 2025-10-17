# Feature: Execution Logging System

## What We're Building

A comprehensive logging system that captures all agent execution data (requests, responses, and streaming events) to both a centralized log file and per-execution directories. This enables observability, debugging, and performance analysis of agent interactions through structured JSON/JSONL files that preserve complete execution traces.

## User Story

As a developer using the agent-cli-sdk
I want to automatically log all agent executions with their inputs, outputs, and streaming events
So that I can debug agent behavior, monitor performance, and trace execution flows across complex multi-agent workflows

## Technical Approach

Implement a non-invasive logging layer that:

1. Hooks into existing execution flow at the CLI wrapper level (before/after execution)
2. Taps into the streaming pipeline to capture events in real-time
3. Provides global configuration via a `setLoggingConfig()` function
4. Allows per-execution overrides via a `logPath` option in execute()
5. Uses filesystem utilities to write logs asynchronously without blocking execution
6. Writes three files per execution: `input.json` (request), `output.json` (response), `stream.jsonl` (events)
7. Appends to a central JSONL log file when configured

The implementation follows existing patterns: utilities in `/src/utils`, type definitions in `/src/types`, and integration points in CLI wrappers and adapters.

## Files to Touch

### Existing Files

- `src/types/config.ts` - Add `LoggingConfig` interface and extend `ExecutionOptions` with `logPath`
- `src/adapters/claude/cli-wrapper.ts` - Integrate logging hooks before/after execution and during streaming
- `src/adapters/codex/cli-wrapper.ts` - Integrate logging hooks (same pattern as Claude)
- `src/adapters/claude/index.ts` - Pass logging config to CLI wrapper
- `src/adapters/codex/index.ts` - Pass logging config to CLI wrapper
- `src/index.ts` - Export `setLoggingConfig`, `getLoggingConfig`, and logging types

### New Files

- `src/utils/logger.ts` - Core logging implementation with file I/O, directory creation, and log formatting
- `src/types/logging.ts` - Type definitions for logging configuration, log entries, and file structures

## Implementation Plan

### Phase 1: Foundation

Create the logging type system and core utilities for file I/O operations. This establishes the data structures and low-level functions needed for writing logs to the filesystem.

### Phase 2: Core Implementation

Implement the logging service with configuration management, file writing logic, and stream capture. This phase builds the actual logging engine that will be called during execution.

### Phase 3: Integration

Hook the logging system into the existing CLI wrappers and adapters, ensuring logs are captured at the right points in the execution lifecycle without disrupting normal operation.

## Step by Step Tasks

### 1: Type System and Interfaces

<!-- prettier-ignore -->
- [ ] Create logging type definitions
    - p[Create new file: `src/types/logging.ts`
    - Define `LoggingConfig` interface with `centralLogPath?: string`
    - Define `ExecutionLogEntry` interface with `timestamp`, `adapter`, `prompt`, `options`, `sessionId`, `workflowId?`
    - Define `LogFiles` interface with `input`, `output`, `stream` paths
    - Add JSDoc comments for all types
- [ ] Extend ExecutionOptions interface
    - File: `src/types/config.ts`
    - Add `logPath?: string` to `ExecutionOptions` interface
    - Add JSDoc: "Optional path to directory for logging this execution's input, output, and stream events"
- [ ] Export logging types from types index
    - File: `src/types/index.ts`
    - Add: `export * from './logging'`

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 2: Core Logging Utility

<!-- prettier-ignore -->
- [ ] Create logger utility scaffold
    - Create new file: `src/utils/logger.ts`
    - Import: `fs/promises`, `path`, `StreamEvent`, `AdapterResponse`, `ExecutionOptions`
    - Add file header comment explaining purpose
- [ ] Implement global logging configuration
    - Add module-level variable: `let globalLoggingConfig: LoggingConfig | null = null`
    - Implement `setLoggingConfig(config: LoggingConfig): void` to set global config
    - Implement `getLoggingConfig(): LoggingConfig | null` to retrieve config
    - Add validation: ensure centralLogPath is absolute if provided
- [ ] Implement directory creation utility
    - Implement `async ensureDirectoryExists(dirPath: string): Promise<void>`
    - Use `fs.mkdir(dirPath, { recursive: true })`
    - Handle EEXIST errors gracefully
    - Catch and log other errors without throwing
- [ ] Implement central log writer
    - Implement `async writeToCentralLog(entry: ExecutionLogEntry): Promise<void>`
    - Check if `globalLoggingConfig?.centralLogPath` is set
    - Ensure parent directory exists
    - Append JSONL line: `JSON.stringify(entry) + '\n'`
    - Use `fs.appendFile()` with UTF-8 encoding
    - Wrap in try-catch, log errors to stderr without throwing
- [ ] Implement per-execution log writer
    - Implement `async writeExecutionLogs(logPath: string, input: object, output: AdapterResponse, events: StreamEvent[]): Promise<void>`
    - Ensure `logPath` directory exists
    - Write `input.json`: `JSON.stringify(input, null, 2)`
    - Write `output.json`: `JSON.stringify(output, null, 2)`
    - Write `stream.jsonl`: one JSON object per line for each event
    - Use `fs.writeFile()` with UTF-8 encoding
    - Execute all writes in parallel with `Promise.all()`
    - Wrap in try-catch, log errors to stderr without throwing
- [ ] Implement execution log entry builder
    - Implement `buildExecutionLogEntry(adapter: string, prompt: string, options: ExecutionOptions, response: AdapterResponse): ExecutionLogEntry`
    - Extract: timestamp, adapter name, prompt, sessionId from response
    - Include: status, duration, exitCode
    - Extract workflowId from logPath if it matches pattern (optional)
    - Return complete ExecutionLogEntry object

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 3: Integrate Logging into Claude Adapter

<!-- prettier-ignore -->
- [ ] Add logging to Claude CLI wrapper
    - File: `src/adapters/claude/cli-wrapper.ts`
    - Import logger functions: `writeToCentralLog`, `writeExecutionLogs`, `buildExecutionLogEntry`, `getLoggingConfig`
    - Before executing CLI: capture start time, build input object with prompt and options
    - After execution completes: check if `options.logPath` is set
    - If `logPath` set: call `writeExecutionLogs()` with collected data
    - After building response: call `writeToCentralLog()` if global config is set
    - Ensure logging errors don't throw or interrupt execution
- [ ] Add logging to Claude adapter
    - File: `src/adapters/claude/index.ts`
    - No changes needed (logging handled in CLI wrapper)
- [ ] Test Claude logging integration
    - Create test script: `examples/logging-claude.ts`
    - Test central log only
    - Test per-execution log only
    - Test both central and per-execution logs
    - Verify files are created correctly
    - Verify JSON is well-formed

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 4: Integrate Logging into Codex Adapter

<!-- prettier-ignore -->
- [ ] Add logging to Codex CLI wrapper
    - File: `src/adapters/codex/cli-wrapper.ts`
    - Import logger functions (same as Claude)
    - Apply same logging pattern as Claude CLI wrapper
    - Before execution: capture start time and input
    - After execution: write logs if configured
    - Ensure logging errors don't throw
- [ ] Add logging to Codex adapter
    - File: `src/adapters/codex/index.ts`
    - No changes needed (logging handled in CLI wrapper)
- [ ] Test Codex logging integration
    - Create test script: `examples/logging-codex.ts`
    - Test same scenarios as Claude
    - Verify files are created correctly

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 5: Public API and Documentation

<!-- prettier-ignore -->
- [ ] Export logging API from main index
    - File: `src/index.ts`
    - Add exports: `setLoggingConfig`, `getLoggingConfig`
    - Add type exports: `LoggingConfig`, `ExecutionLogEntry`
- [ ] Update TypeScript build
    - Run: `npm run build`
    - Verify no type errors
    - Verify exports are in dist/
- [ ] Create comprehensive example
    - Create: `examples/logging-workflow.ts`
    - Demonstrate: multi-agent workflow with workflowId pattern
    - Show: central log + per-agent logs
    - Show: reading logs back for analysis
    - Include comments explaining each step

#### Completion Notes

(This will be filled in by the agent implementing this phase)

### 6: Error Handling and Edge Cases

<!-- prettier-ignore -->
- [ ] Handle filesystem permission errors
    - Verify error messages are helpful
    - Ensure errors don't crash execution
    - Log to stderr when logging fails
- [ ] Handle invalid paths
    - Validate paths are not empty strings
    - Handle relative vs absolute paths appropriately
    - Test with special characters in paths
- [ ] Handle concurrent writes
    - Test multiple simultaneous executions
    - Verify no race conditions in file writes
    - Ensure appendFile is atomic for central log
- [ ] Handle large payloads
    - Test with large prompts (>10KB)
    - Test with many stream events (>1000)
    - Ensure no memory issues or blocking

#### Completion Notes

(This will be filled in by the agent implementing this phase)

## Acceptance Criteria

**Must Work:**

- [ ] Central log appends JSONL entries with complete execution metadata
- [ ] Per-execution logs create directory structure if it doesn't exist
- [ ] Three files per execution: `input.json`, `output.json`, `stream.jsonl`
- [ ] Streaming events are captured in real-time to stream.jsonl
- [ ] Global config and per-execution config work independently
- [ ] Logging failures don't interrupt normal execution
- [ ] All JSON files are well-formed and parseable
- [ ] Works with both Claude and Codex adapters
- [ ] TypeScript types are exported and usable

**Should Not:**

- [ ] Break existing functionality when logging is not configured
- [ ] Throw errors if directories can't be created
- [ ] Block execution while writing logs
- [ ] Leak sensitive data in logs (same as already in responses)
- [ ] Create performance overhead >5% when logging is enabled

## Validation

Execute these commands to verify the feature works correctly:

**Automated Verification:**

```bash
# Build verification
npm run build
# Expected: Clean build with no errors, logger.ts and logging.ts compiled to dist/

# Type checking
npx tsc --noEmit
# Expected: No type errors

# Linting
npm run lint
# Expected: No lint errors

# Unit tests (if applicable)
npm test
# Expected: All existing tests pass
```

**Manual Verification:**

1. Start test script: `npx tsx examples/logging-workflow.ts`
2. Verify: Central log file created at configured path
3. Verify: Per-execution directories created with input/output/stream files
4. Check: All JSON files are well-formed (use `jq` or JSON validator)
5. Test: Execute without logging config - no errors, no logs created
6. Test: Execute with only central log - only central log created
7. Test: Execute with only logPath - only per-execution logs created
8. Test: Execute with both - both logging methods work independently

**Feature-Specific Checks:**

- Verify `stream.jsonl` contains all streaming events in JSONL format
- Verify `input.json` contains prompt and execution options
- Verify `output.json` matches the AdapterResponse structure
- Verify central log entries have correct timestamp, adapter, and session info
- Test workflow pattern: `logs/workflow-123/agent-1/` structure works
- Verify concurrent executions don't corrupt logs
- Check stderr output when logging fails (permission error, invalid path)

## Definition of Done

- [ ] All tasks completed
- [ ] Build passes with no TypeScript errors
- [ ] Lint passes
- [ ] Manual testing confirms all logging scenarios work
- [ ] No errors in execution flow when logging fails
- [ ] Code follows existing patterns (utils/, types/ structure)
- [ ] Logging is opt-in and doesn't affect default behavior
- [ ] Documentation example demonstrates key use cases

## Notes

**Dependencies:**

- Requires Node.js `fs/promises` API (Node 14+)
- No external dependencies needed

**Future Considerations:**

- Log rotation for central log file
- Compression for old logs
- Configurable log levels (debug, info, warn, error)
- Structured search/query API for logs
- Log streaming to external services (Datadog, CloudWatch)
- Redaction of sensitive data in logs

**Performance Considerations:**

- Use async I/O to avoid blocking execution
- Consider batching central log writes if performance issues arise
- Stream.jsonl writes should be buffered by Node.js file streams

**Security Considerations:**

- Logs contain same data as AdapterResponse (not introducing new data exposure)
- Validate paths to prevent directory traversal attacks
- Consider adding option to exclude sensitive fields from logs
