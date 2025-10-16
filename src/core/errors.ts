/**
 * Base error class for all adapter errors
 */
export class AdapterError extends Error {
  /** Error code for programmatic handling */
  code: string;
  /** Additional error details */
  details?: any;
  /** Recovery suggestion for the user */
  recovery?: string;

  constructor(message: string, code: string = 'ADAPTER_ERROR', details?: any, recovery?: string) {
    super(message);
    this.name = 'AdapterError';
    this.code = code;
    this.details = details;
    this.recovery = recovery;
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends AdapterError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR');
    this.name = 'ConfigurationError';
    this.details = details;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error thrown during CLI execution
 */
export class ExecutionError extends AdapterError {
  constructor(message: string, details?: any) {
    super(message, 'EXECUTION_ERROR', details);
    this.name = 'ExecutionError';
    Object.setPrototypeOf(this, ExecutionError.prototype);
  }
}

/**
 * Error thrown when input validation fails
 */
export class ValidationError extends AdapterError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when operation times out
 */
export class TimeoutError extends AdapterError {
  /** Session ID for resuming if available */
  sessionId?: string;
  /** Partial output captured before timeout */
  partialOutput?: string;

  constructor(message: string, sessionId?: string, partialOutput?: string) {
    super(message, 'TIMEOUT');
    this.name = 'TimeoutError';
    this.sessionId = sessionId;
    this.partialOutput = partialOutput;
    this.recovery = sessionId
      ? `Resume with: execute(prompt, { sessionId: '${sessionId}' })`
      : 'Try increasing the timeout value';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Error thrown when CLI is not authenticated
 */
export class AuthenticationError extends AdapterError {
  constructor(adapter: 'claude' | 'codex') {
    const message = `${adapter} CLI is not authenticated`;
    super(message, 'AUTH_REQUIRED');
    this.name = 'AuthenticationError';
    this.recovery =
      adapter === 'claude'
        ? 'Run: claude setup-token'
        : 'Run: codex login';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when CLI binary is not found in PATH
 */
export class CLINotFoundError extends AdapterError {
  constructor(cliName: string, installationGuide?: string) {
    const message = `${cliName} CLI not found in PATH`;
    super(message, 'CLI_NOT_FOUND');
    this.name = 'CLINotFoundError';
    this.recovery = installationGuide || `Install ${cliName} CLI and ensure it's in your PATH`;
    Object.setPrototypeOf(this, CLINotFoundError.prototype);
  }
}

/**
 * Error thrown when model is overloaded
 */
export class ModelOverloadError extends AdapterError {
  constructor(message: string = 'Model is currently overloaded') {
    super(message, 'MODEL_OVERLOAD');
    this.name = 'ModelOverloadError';
    this.recovery = 'Retry the request in a few moments or use a fallback model';
    Object.setPrototypeOf(this, ModelOverloadError.prototype);
  }
}

/**
 * Error thrown when permission is denied
 */
export class PermissionDeniedError extends AdapterError {
  constructor(operation: string) {
    const message = `Permission denied for operation: ${operation}`;
    super(message, 'PERMISSION_DENIED');
    this.name = 'PermissionDeniedError';
    this.recovery = 'Check sandbox settings or permission modes';
    Object.setPrototypeOf(this, PermissionDeniedError.prototype);
  }
}
