import type { ExecutionOptions, AdapterConfig } from './config.js';

/**
 * Claude Code specific configuration
 */
export interface ClaudeConfig extends AdapterConfig {
  /** API key for authentication (from ANTHROPIC_API_KEY env var) */
  apiKey?: string;
  /** OAuth token for authentication (from CLAUDE_CODE_OAUTH_TOKEN env var) */
  oauthToken?: string;
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
  model?: string;
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
}
