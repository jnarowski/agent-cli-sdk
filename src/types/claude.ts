import type { ExecutionOptions, AdapterConfig } from './config.js';

/**
 * Claude model identifiers
 * Supports both short aliases (e.g., 'sonnet') and full model IDs
 */
export type ClaudeModel =
  // Short aliases (automatically map to latest versions)
  | 'sonnet'
  | 'opus'
  | 'haiku'
  // Version aliases
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'
  | 'claude-opus-4-1'
  | 'claude-sonnet-4-0'
  | 'claude-opus-4-0'
  | 'claude-3-7-sonnet-latest'
  | 'claude-3-5-haiku-latest'
  // Specific versioned models
  | 'claude-sonnet-4-5-20250929'
  | 'claude-haiku-4-5-20251001'
  | 'claude-opus-4-1-20250805'
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-20250514'
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-haiku-20241022'
  | 'claude-3-haiku-20240307'
  | string;               // Allow custom model IDs

/**
 * Claude Code specific configuration
 */
export interface ClaudeConfig extends AdapterConfig {
  /** API key for authentication (from ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** OAuth token for authentication (from CLAUDE_CODE_OAUTH_TOKEN env var) */
  oauthToken?: string;
  /** Enable verbose logging to see CLI commands and arguments */
  verbose?: boolean;
  /** Working directory for CLI execution */
  workingDir?: string;
}

/**
 * Claude output format types
 */
export type ClaudeOutputFormat = 'text' | 'json' | 'stream-json';

/**
 * Claude permission modes
 */
export type ClaudePermissionMode = 'acceptEdits' | 'bypassPermissions' | 'default' | 'plan';

/**
 * Claude execution options
 */
export interface ClaudeExecutionOptions extends ExecutionOptions {
  /** Model to use (default: 'sonnet' which maps to claude-sonnet-4-5) */
  model?: ClaudeModel;
  /** Output format for the CLI */
  outputFormat?: ClaudeOutputFormat;
  /** Permission mode for tool execution */
  permissionMode?: ClaudePermissionMode;
  /** System prompt to prepend */
  systemPrompt?: string;
  /** System prompt to append */
  appendSystemPrompt?: string;
  /** Tools that are allowed to be used */
  allowedTools?: string[];
  /** Tools that should be disallowed */
  disallowedTools?: string[];
  /** Include partial messages in streaming mode */
  includePartialMessages?: boolean;
  /** Fallback model if primary model is overloaded */
  fallbackModel?: string;
  /** Skip permission prompts (use with caution) */
  dangerouslySkipPermissions?: boolean;
  /** Enable verbose logging (usually set from config, but can be overridden) */
  verbose?: boolean;
  /** Working directory for CLI execution (usually set from config, but can be overridden) */
  workingDir?: string;
}
