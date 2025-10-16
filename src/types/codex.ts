import type { ExecutionOptions, AdapterConfig } from './config.js';

/**
 * OpenAI model identifiers for Codex
 * Based on 2025 OpenAI model lineup
 */
export type OpenAIModel =
  // GPT-5 Family (Latest, Released August 2025)
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-5-pro'
  // GPT-4.1 Family (Released April 2025)
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  // GPT-4.5 Family (Released February 2025)
  | 'gpt-4.5'
  | 'gpt-4.5-preview'
  // GPT-4 Family
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-4o'
  // GPT-3.5 Family
  | 'gpt-3.5-turbo'
  // Reasoning Models (o-series)
  | 'o3'
  | 'o3-mini'
  | 'o4-mini'
  | 'o4-mini-high'
  // Legacy/Other
  | 'o1'
  | 'o1-preview'
  | 'o1-mini'
  | string;               // Allow custom model IDs

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
  model?: OpenAIModel;
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
