/**
 * Core logging utility for agent execution tracking.
 * Provides functionality to write per-execution logs to directories
 * with input/output/stream files.
 */

import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import type {
  StreamEvent,
  AdapterResponse,
} from '../types/config';

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
 * Write execution logs to a per-execution directory.
 * Creates three files: input.json, output.json, and stream.jsonl.
 *
 * @template T The type of the output
 * @param logPath - Directory path where log files will be written
 * @param input - Input object containing prompt and options
 * @param output - Full AdapterResponse object
 * @param events - Array of streaming events
 */
export async function writeExecutionLogs<T = string>(
  logPath: string,
  input: object,
  output: AdapterResponse<T>,
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
