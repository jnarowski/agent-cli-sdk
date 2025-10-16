import { ValidationError } from '../core/errors.js';
import type { ExecutionOptions } from '../types/config.js';

/**
 * Validate adapter configuration
 */
export function validateConfig(_adapter: 'claude' | 'codex', config: any): void {
  if (config === null || config === undefined) {
    return; // Empty config is allowed
  }

  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new ValidationError('Config must be an object');
  }

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
    // Note: onStream without streaming is allowed, just won't be called
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
 * Sanitize and validate prompt input
 */
export function sanitizePrompt(prompt: string): string {
  const trimmed = prompt.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Prompt cannot be empty');
  }

  if (trimmed.length > 50000) {
    throw new ValidationError('Prompt is too long (maximum 50000 characters)');
  }

  return trimmed;
}

/**
 * Get environment variable with optional default
 */
export function getEnvVar(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}
