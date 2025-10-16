/**
 * @sourceborn/agent-cli-sdk
 *
 * TypeScript SDK for orchestrating AI-powered CLI tools (Claude Code, Codex)
 * in development workflows
 */

// Core interfaces and base classes
export type { AIAdapter, AdapterCapabilities } from './core/interfaces.js';
export { BaseAdapter } from './core/base-adapter.js';

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
} from './core/errors.js';

// Adapter implementations
export { ClaudeAdapter } from './adapters/claude/index.js';
export { CodexAdapter } from './adapters/codex/index.js';

// Factory functions
export { createClaudeAdapter, createCodexAdapter } from './utils/factory.js';

// Utilities
export {
  sequential,
  parallel,
  waterfall,
  retry,
  race,
  type AsyncOperation,
} from './utils/async.js';
export { findCLI, isCLIInstalled } from './utils/cli-detector.js';
export { validateConfig, validateExecutionOptions, sanitizeInput, getEnvVar } from './utils/validation.js';

// Types
export type {
  StreamEvent,
  StreamEventType,
  ActionLog,
  ResponseStatus,
  AdapterResponse,
  ExecutionOptions,
  AdapterConfig,
  ClaudeConfig,
  ClaudeOutputFormat,
  ClaudePermissionMode,
  ClaudeExecutionOptions,
  CodexConfig,
  CodexSandboxMode,
  CodexApprovalPolicy,
  CodexExecutionOptions,
} from './types/index.js';
