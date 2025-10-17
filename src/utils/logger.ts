/**
 * Core logging utility for agent execution tracking.
 * Provides functionality to write execution logs to both a central JSONL file
 * and per-execution directories with input/output/stream files.
 */

import { appendFile, mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type {
  StreamEvent,
  AdapterResponse,
  ExecutionOptions,
} from '../types/config';
import type { LoggingConfig, ExecutionLogEntry } from '../types/logging';

/**
 * Global logging configuration
 */
let globalLoggingConfig: LoggingConfig | null = null;

/**
 * Set the global logging configuration.
 * This enables central logging to a JSONL file for all executions.
 *
 * @param config - Logging configuration with optional centralLogPath
 */
export function setLoggingConfig(config: LoggingConfig): void {
  // Validate that centralLogPath is absolute if provided
  if (config.centralLogPath && !path.isAbsolute(config.centralLogPath)) {
    console.error(
      '[logger] Warning: centralLogPath should be an absolute path:',
      config.centralLogPath
    );
  }
  globalLoggingConfig = config;
}

/**
 * Get the current global logging configuration.
 *
 * @returns The current logging config, or null if not set
 */
export function getLoggingConfig(): LoggingConfig | null {
  return globalLoggingConfig;
}

/**
 * Ensure a directory exists, creating it recursively if needed.
 * Handles EEXIST errors gracefully and logs other errors without throwing.
 *
 * @param dirPath - Directory path to create
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: unknown) {
    // EEXIST is fine, directory already exists
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 'EEXIST'
    ) {
      return;
    }
    // Log other errors but don't throw - logging failures shouldn't break execution
    console.error(
      `[logger] Failed to create directory ${dirPath}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Write an execution log entry to the central JSONL log file.
 * Each line in the file is a separate JSON object representing one execution.
 *
 * @param entry - The execution log entry to write
 */
export async function writeToCentralLog(
  entry: ExecutionLogEntry
): Promise<void> {
  if (!globalLoggingConfig?.centralLogPath) {
    return; // Central logging not configured
  }

  try {
    const logPath = globalLoggingConfig.centralLogPath;
    const logDir = path.dirname(logPath);

    // Ensure parent directory exists
    await ensureDirectoryExists(logDir);

    // Append JSONL line (one JSON object per line)
    const jsonLine = JSON.stringify(entry) + '\n';
    await appendFile(logPath, jsonLine, 'utf-8');
  } catch (error: unknown) {
    // Log errors but don't throw - logging failures shouldn't break execution
    console.error(
      '[logger] Failed to write to central log:',
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Write execution logs to a per-execution directory.
 * Creates three files: input.json, output.json, and stream.jsonl.
 *
 * @param logPath - Directory path where log files will be written
 * @param input - Input object containing prompt and options
 * @param output - Full AdapterResponse object
 * @param events - Array of streaming events
 */
export async function writeExecutionLogs(
  logPath: string,
  input: object,
  output: AdapterResponse,
  events: StreamEvent[]
): Promise<void> {
  try {
    // Ensure log directory exists
    await ensureDirectoryExists(logPath);

    // Build JSONL for stream events (one JSON object per line)
    const streamJsonl = events.map((event) => JSON.stringify(event)).join('\n');

    // Write all files in parallel
    await Promise.all([
      writeFile(
        path.join(logPath, 'input.json'),
        JSON.stringify(input, null, 2),
        'utf-8'
      ),
      writeFile(
        path.join(logPath, 'output.json'),
        JSON.stringify(output, null, 2),
        'utf-8'
      ),
      writeFile(
        path.join(logPath, 'stream.jsonl'),
        streamJsonl + (streamJsonl ? '\n' : ''),
        'utf-8'
      ),
    ]);
  } catch (error: unknown) {
    // Log errors but don't throw - logging failures shouldn't break execution
    console.error(
      `[logger] Failed to write execution logs to ${logPath}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

/**
 * Build an execution log entry from execution data.
 * Extracts relevant metadata for the central log.
 *
 * @param adapter - Adapter name (e.g., 'claude', 'codex')
 * @param prompt - The prompt sent to the agent
 * @param options - Execution options used
 * @param response - The full adapter response
 * @returns A complete execution log entry
 */
export function buildExecutionLogEntry(
  adapter: string,
  prompt: string,
  options: ExecutionOptions,
  response: AdapterResponse
): ExecutionLogEntry {
  // Extract workflowId from logPath if it matches pattern: logs/workflow-{id}/...
  let workflowId: string | undefined;
  if (options.logPath) {
    const workflowMatch = options.logPath.match(/workflow-([^/]+)/);
    if (workflowMatch) {
      workflowId = workflowMatch[1];
    }
  }

  return {
    timestamp: new Date().toISOString(),
    adapter,
    prompt,
    options,
    sessionId: response.sessionId,
    workflowId,
    status: response.status,
    duration: response.duration,
    exitCode: response.exitCode,
  };
}
