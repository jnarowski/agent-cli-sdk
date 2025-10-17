import type { AIAdapter, AdapterCapabilities } from '../types/interfaces';
import type { ExecutionResponse, ExecutionOptions } from '../types/config';
import { ValidationError } from './errors';

/**
 * Base adapter class providing shared functionality
 * All concrete adapters should extend this class
 */
export abstract class BaseAdapter implements AIAdapter {
  protected cliPath: string;

  constructor(cliPath: string) {
    this.cliPath = cliPath;
  }

  /**
   * Execute a prompt - must be implemented by concrete adapters
   * @template T The expected type of the output (inferred from responseSchema)
   */
  abstract execute<T = string>(prompt: string, options?: ExecutionOptions): Promise<ExecutionResponse<T>>;

  /**
   * Get adapter capabilities - must be implemented by concrete adapters
   */
  abstract getCapabilities(): AdapterCapabilities;

  /**
   * Validate prompt input
   */
  protected validatePrompt(prompt: string): void {
    if (!prompt || typeof prompt !== 'string') {
      throw new ValidationError('Prompt must be a non-empty string');
    }
    if (prompt.trim().length === 0) {
      throw new ValidationError('Prompt cannot be empty or whitespace only');
    }
  }

  /**
   * Validate execution options
   */
  protected validateOptions(options?: ExecutionOptions): void {
    if (!options) return;

    if (options.timeout !== undefined) {
      if (typeof options.timeout !== 'number' || options.timeout <= 0) {
        throw new ValidationError('Timeout must be a positive number');
      }
    }

    if (options.streaming !== undefined && typeof options.streaming !== 'boolean') {
      throw new ValidationError('streaming option must be a boolean');
    }

    if (options.onStream !== undefined) {
      if (typeof options.onStream !== 'function') {
        throw new ValidationError('onStream must be a function');
      }
      if (!options.streaming) {
        throw new ValidationError('onStream callback requires streaming to be enabled');
      }
    }
  }

  /**
   * Generate a session ID
   */
  protected generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Measure execution duration
   */
  protected startTimer(): () => number {
    const start = Date.now();
    return () => Date.now() - start;
  }
}
