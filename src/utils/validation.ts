import { ValidationError } from '../core/errors.js';
import type { AdapterConfig, ExecutionOptions } from '../types/config.js';

/**
 * Validate adapter configuration
 */
export function validateConfig(config: AdapterConfig): void {
  if (config.cliPath !== undefined && typeof config.cliPath !== 'string') {
    throw new ValidationError('cliPath must be a string');
  }
}

/**
 * Validate execution options
 */
export function validateExecutionOptions(options: ExecutionOptions): void {
  if (options.timeout !== undefined) {
    if (typeof options.timeout !== 'number' || options.timeout <= 0) {
      throw new ValidationError('timeout must be a positive number');
    }
  }

  if (options.streaming !== undefined && typeof options.streaming !== 'boolean') {
    throw new ValidationError('streaming must be a boolean');
  }

  if (options.onStream !== undefined) {
    if (typeof options.onStream !== 'function') {
      throw new ValidationError('onStream must be a function');
    }
    if (!options.streaming) {
      throw new ValidationError('onStream callback requires streaming to be enabled');
    }
  }

  if (options.sessionId !== undefined && typeof options.sessionId !== 'string') {
    throw new ValidationError('sessionId must be a string');
  }
}

/**
 * Sanitize input string to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  // Remove null bytes
  return input.replace(/\0/g, '');
}

/**
 * Get environment variable with optional default
 */
export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}
