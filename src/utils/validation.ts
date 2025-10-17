import { ValidationError } from '../core/errors';
import type { ExecutionOptions } from '../types/config';

/**
 * Validate adapter configuration
 */
export function validateConfig(_adapter: 'claude' | 'codex', config: unknown): void {
  if (config === null || config === undefined) {
    return; // Empty config is allowed
  }

  if (typeof config !== 'object' || Array.isArray(config)) {
    throw new ValidationError('Config must be an object');
  }

  const configObj = config as Record<string, unknown>;
  if (configObj.cliPath !== undefined && typeof configObj.cliPath !== 'string') {
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

/**
 * Validates an email address using regex
 *
 * This function uses a comprehensive regex pattern that follows RFC 5322 standards
 * with practical limitations for common use cases.
 *
 * Valid formats:
 * - user@domain.com
 * - first.last@domain.co.uk
 * - user+tag@domain.com
 * - user_name@sub.domain.org
 *
 * @param email - The email address to validate
 * @returns true if the email is valid, false otherwise
 *
 * @example
 * ```ts
 * validateEmail('user@example.com') // returns true
 * validateEmail('invalid.email') // returns false
 * validateEmail('user@') // returns false
 * ```
 */
export function validateEmail(email: string): boolean {
  if (typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedEmail = email.trim();

  // Basic length check
  if (trimmedEmail.length === 0 || trimmedEmail.length > 254) {
    return false;
  }

  // RFC 5322 compliant email regex with practical limitations
  // Pattern breakdown:
  // - Local part: alphanumeric, dots, hyphens, underscores, plus signs
  // - @ symbol (required)
  // - Domain: alphanumeric, dots, hyphens
  // - TLD: at least 2 characters
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }

  // Additional validation: check for consecutive dots
  if (trimmedEmail.includes('..')) {
    return false;
  }

  // Split and validate local and domain parts
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;

  // Local part validation
  if (!localPart || localPart.length === 0 || localPart.length > 64) {
    return false;
  }

  // Local part cannot start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }

  // Domain part validation
  if (!domain || domain.length === 0 || domain.length > 253) {
    return false;
  }

  // Ensure domain has at least one dot and a valid TLD
  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return false;
  }

  // Validate TLD (last part of domain)
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false;
  }

  return true;
}
