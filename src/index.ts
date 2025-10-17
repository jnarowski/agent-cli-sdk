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
  ConfigurationError,
  ExecutionError,
  ValidationError,
  TimeoutError,
  AuthenticationError,
  CLINotFoundError,
  ModelOverloadError,
  PermissionDeniedError,
} from './core/errors';

// Adapter implementations
export { ClaudeAdapter } from './adapters/claude';
export { CodexAdapter } from './adapters/codex';

// Factory functions
export { createClaudeAdapter, createCodexAdapter } from './utils/factory';

// Utilities
export { renderConsoleBox, type RenderBoxOptions } from './utils/renderConsoleBox';
export { setLoggingConfig, getLoggingConfig } from './utils/logger';

// Types
export type {
  StreamEvent,
  StreamEventType,
  ActionLog,
  ResponseStatus,
  AdapterResponse,
  ExecutionOptions,
  AdapterConfig,
  LoggingConfig,
  ExecutionLogEntry,
  LogFiles,
  ClaudeConfig,
  ClaudeOutputFormat,
  ClaudePermissionMode,
  ClaudeExecutionOptions,
  CodexConfig,
  CodexSandboxMode,
  CodexApprovalPolicy,
  CodexExecutionOptions,
} from './types/index';
