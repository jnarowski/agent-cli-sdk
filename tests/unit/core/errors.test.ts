import { describe, it, expect } from 'vitest';
import {
  AdapterError,
  ExecutionError,
  ValidationError,
  TimeoutError,
  AuthenticationError,
  CLINotFoundError,
} from '../../../src/core/errors';

describe('Error Classes', () => {
  describe('AdapterError', () => {
    it('should create basic error with message', () => {
      const error = new AdapterError('Something went wrong');
      expect(error.message).toBe('Something went wrong');
      expect(error).toBeInstanceOf(Error);
    });

    it('should include error code', () => {
      const error = new AdapterError('Error', 'TEST_ERROR');
      expect(error.code).toBe('TEST_ERROR');
    });

    it('should include recovery suggestions', () => {
      const error = new AdapterError('Error', 'TEST_ERROR', undefined, 'Try again');
      expect(error.recovery).toBe('Try again');
    });
  });

  describe('AuthenticationError', () => {
    it('should provide Claude authentication guidance', () => {
      const error = new AuthenticationError('claude');
      expect(error.message).toContain('not authenticated');
      expect(error.recovery).toContain('claude setup-token');
      expect(error.code).toBe('AUTH_REQUIRED');
    });

    it('should provide Codex authentication guidance', () => {
      const error = new AuthenticationError('codex');
      expect(error.message).toContain('not authenticated');
      expect(error.recovery).toContain('codex login');
      expect(error.code).toBe('AUTH_REQUIRED');
    });
  });

  describe('CLINotFoundError', () => {
    it('should provide installation instructions', () => {
      const error = new CLINotFoundError('claude', 'Install from https://example.com');
      expect(error.message).toContain('not found');
      expect(error.recovery).toContain('https://example.com');
      expect(error.code).toBe('CLI_NOT_FOUND');
    });
  });

  describe('TimeoutError', () => {
    it('should include basic timeout information', () => {
      const error = new TimeoutError('Operation timed out');
      expect(error.message).toBe('Operation timed out');
      expect(error.code).toBe('TIMEOUT');
    });

    it('should include session ID for resumption', () => {
      const error = new TimeoutError('Timeout', 'session-123');
      expect(error.sessionId).toBe('session-123');
      expect(error.recovery).toContain('session-123');
    });

    it('should include partial output', () => {
      const error = new TimeoutError('Timeout', 'session-123', 'Partial result...');
      expect(error.partialOutput).toBe('Partial result...');
    });
  });

  describe('ValidationError', () => {
    it('should include validation details', () => {
      const error = new ValidationError('Invalid config', { field: 'apiKey' });
      expect(error.message).toBe('Invalid config');
      expect(error.details).toEqual({ field: 'apiKey' });
      expect(error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('ExecutionError', () => {
    it('should wrap CLI execution errors', () => {
      const error = new ExecutionError('CLI failed', { exitCode: 1, stderr: 'stderr output' });
      expect(error.message).toBe('CLI failed');
      expect(error.code).toBe('EXECUTION_ERROR');
      expect(error.details).toEqual({ exitCode: 1, stderr: 'stderr output' });
    });
  });

  describe('error inheritance', () => {
    it('should maintain proper error chain', () => {
      const error = new AuthenticationError('claude');
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error).toBeInstanceOf(AdapterError);
      expect(error).toBeInstanceOf(Error);
    });

    it('should work with try-catch', () => {
      try {
        throw new ValidationError('Test error');
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        expect(e).toBeInstanceOf(AdapterError);
      }
    });
  });
});
