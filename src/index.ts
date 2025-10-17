/**
 * @sourceborn/agent-cli-sdk
 *
 * TypeScript SDK for orchestrating AI-powered CLI tools (Claude Code, Codex)
 * in development workflows
 */

// Core interfaces and base classes (for extending the library)
export type { AIAdapter, AdapterCapabilities } from './core/interfaces';
export { BaseAdapter } from './core/base-adapter';

// Error classes
export {
  AdapterError,
  ExecutionError,
  ValidationError,
  TimeoutError,
  AuthenticationError,
  CLINotFoundError,
} from './core/errors';

// Adapter implementations
export { ClaudeAdapter } from './adapters/claude';
export { CodexAdapter } from './adapters/codex';

// Factory functions
export { createClaudeAdapter, createCodexAdapter } from './utils/factory';

// Utilities
export { setLoggingConfig, getLoggingConfig } from './utils/logger';
export { extractJsonFromOutput, validateWithSchema } from './utils/json-parser';

// Types
export type {
  ClaudeConfig,
  ClaudeOutputFormat,
  ClaudeExecutionOptions,
  CodexConfig,
  CodexExecutionOptions,
} from './types/index';
