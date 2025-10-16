import type { ExecutionOptions, AdapterConfig } from './config.js';

/**
 * Codex specific configuration
 */
export interface CodexConfig extends AdapterConfig {
  /** API key for authentication (optional, OAuth via 'codex login' is default) */
  apiKey?: string;
  /** Working directory for CLI execution */
  workingDirectory?: string;
}

/**
 * Codex sandbox modes
 */
export type CodexSandboxMode = 'read-only' | 'workspace-write' | 'danger-full-access';

/**
 * Codex approval policies
 */
export type CodexApprovalPolicy = 'untrusted' | 'on-failure' | 'on-request' | 'never';

/**
 * Codex execution options
 */
export interface CodexExecutionOptions extends ExecutionOptions {
  /** Model to use (default: 'gpt-5') */
  model?: string;
  /** Working directory for execution (usually set from config, but can be overridden) */
  workingDirectory?: string;
  /** Sandbox mode for file system access */
  sandbox?: CodexSandboxMode;
  /** Approval policy for operations */
  approvalPolicy?: CodexApprovalPolicy;
  /** Full auto mode (combines workspace-write sandbox + on-failure approval) */
  fullAuto?: boolean;
  /** Enable web search capability */
  enableSearch?: boolean;
  /** Image inputs for multi-modal execution */
  images?: string[];
  /** Configuration overrides */
  configOverrides?: Record<string, unknown>;
  /** Configuration profile to use */
  profile?: string;
}
