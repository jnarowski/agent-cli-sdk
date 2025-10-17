import type { ExecutionOptions } from './config.js';

/**
 * Configuration for the logging system.
 * Controls where execution logs are written.
 */
export interface LoggingConfig {
  /**
   * Path to a central JSONL log file that appends all executions.
   * Each line is a JSON object representing one execution.
   * If not specified, central logging is disabled.
   */
  centralLogPath?: string;
}

/**
 * Entry written to the central log file in JSONL format.
 * Represents metadata about a single execution.
 */
export interface ExecutionLogEntry {
  /** ISO 8601 timestamp when execution started */
  timestamp: string;
  /** Adapter used (e.g., 'claude', 'codex') */
  adapter: string;
  /** The prompt sent to the agent */
  prompt: string;
  /** Execution options used */
  options: ExecutionOptions;
  /** Session ID from the response */
  sessionId: string;
  /** Optional workflow ID extracted from logPath pattern */
  workflowId?: string;
  /** Execution status */
  status: string;
  /** Duration in milliseconds */
  duration: number;
  /** Exit code from CLI process */
  exitCode: number;
}

/**
 * Paths to the three log files created per execution
 */
export interface LogFiles {
  /** Path to input.json (prompt + options) */
  input: string;
  /** Path to output.json (full AdapterResponse) */
  output: string;
  /** Path to stream.jsonl (streaming events) */
  stream: string;
}
