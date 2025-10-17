import { BaseAdapter } from '../../core/base-adapter.js';
import type { AdapterCapabilities } from '../../core/interfaces.js';
import type { AdapterResponse } from '../../types/config.js';
import type { ClaudeConfig, ClaudeExecutionOptions } from '../../types/claude.js';
import { executeClaudeCLI } from './cli-wrapper.js';
import { parseStreamOutput } from './parser.js';
import { ExecutionError, AuthenticationError, CLINotFoundError } from '../../core/errors.js';
import { detectClaudeCLI } from './cli-detector.js';
import {
  writeToCentralLog,
  writeExecutionLogs,
  buildExecutionLogEntry,
} from '../../utils/logger.js';

/**
 * Claude Code adapter implementation
 */
export class ClaudeAdapter extends BaseAdapter {
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig = {}) {
    // Auto-detect CLI path if not provided
    const resolvedPath = config.cliPath || detectClaudeCLI();

    if (!resolvedPath) {
      throw new CLINotFoundError(
        'claude',
        'Claude CLI not found. Please install it or provide a cliPath.\n' +
        'Visit https://docs.anthropic.com/claude/docs/claude-cli for installation instructions or set CLAUDE_CLI_PATH environment variable'
      );
    }

    super(resolvedPath);
    this.config = config;
  }

  /**
   * Execute a prompt with Claude Code CLI
   */
  async execute(
    prompt: string,
    options: ClaudeExecutionOptions = {}
  ): Promise<AdapterResponse> {
    // Validate inputs
    this.validatePrompt(prompt);
    this.validateOptions(options);

    // Check authentication if needed
    await this.checkAuthentication();

    // Merge config with options (options take precedence)
    const mergedOptions: ClaudeExecutionOptions = {
      ...options,
    };

    // Set defaults
    if (!mergedOptions.model) {
      mergedOptions.model = 'sonnet'; // Default to latest Sonnet
    }

    // Default dangerouslySkipPermissions to true for better UX
    if (mergedOptions.dangerouslySkipPermissions === undefined) {
      mergedOptions.dangerouslySkipPermissions = true;
    }

    try {
      // Capture input for logging
      const inputData = {
        prompt,
        options: mergedOptions,
      };

      // Execute CLI with config-level settings (options can override config)
      const result = await executeClaudeCLI(this.cliPath, prompt, {
        verbose: this.config.verbose,
        workingDir: this.config.workingDir,
        ...mergedOptions,
      });

      // Parse output - always use parseStreamOutput since we use stream-json format
      const response = parseStreamOutput(result.stdout, result.duration, result.exitCode);

      // Add stderr to raw output
      if (response.raw) {
        response.raw.stderr = result.stderr;
      }

      // Write execution logs if logPath is configured
      if (mergedOptions.logPath) {
        const events = response.raw?.events || [];
        // Fire-and-forget: don't await to avoid blocking
        writeExecutionLogs(
          mergedOptions.logPath,
          inputData,
          response,
          events
        ).catch(() => {
          // Errors already logged in writeExecutionLogs
        });
      }

      // Write to central log if configured
      const logEntry = buildExecutionLogEntry(
        'claude',
        prompt,
        mergedOptions,
        response
      );
      // Fire-and-forget: don't await to avoid blocking
      writeToCentralLog(logEntry).catch(() => {
        // Errors already logged in writeToCentralLog
      });

      return response;
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        // Check for authentication errors
        if (
          error.message.includes('not authenticated') ||
          error.message.includes('no auth token')
        ) {
          throw new AuthenticationError('claude');
        }

        throw new ExecutionError(
          `Claude execution failed: ${error.message}`,
          {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        );
      }

      throw error;
    }
  }

  /**
   * Get adapter capabilities
   */
  getCapabilities(): AdapterCapabilities {
    return {
      streaming: true,
      sessionManagement: true,
      toolCalling: true,
      multiModal: false, // Claude Code CLI doesn't currently support image inputs
    };
  }

  /**
   * Check if Claude CLI is authenticated
   * This is a best-effort check - actual auth errors will be caught during execution
   */
  private async checkAuthentication(): Promise<void> {
    // If API key or OAuth token is provided in config, assume authenticated
    if (this.config.apiKey || this.config.oauthToken) {
      return;
    }

    // Otherwise, let the CLI handle authentication
    // The CLI will throw an error if not authenticated
  }
}
