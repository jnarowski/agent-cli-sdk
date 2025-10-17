import { BaseAdapter } from '../../core/base-adapter';
import type { AdapterCapabilities } from '../../types/interfaces';
import type { ExecutionResponse } from '../../types/config';
import type { ClaudeConfig, ClaudeExecutionOptions } from '../../types/claude';
import { executeClaudeCLI } from './cli-wrapper';
import { parseStreamOutput } from './parser';
import { ExecutionError, AuthenticationError, CLINotFoundError } from '../../core/errors';
import { detectClaudeCLI } from './cli-detector';
import { writeExecutionLogs } from '../../utils/logger';

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
   * @template T The expected type of the output (inferred from responseSchema)
   */
  async execute<T = string>(prompt: string, options: ClaudeExecutionOptions = {}): Promise<ExecutionResponse<T>> {
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

    // Capture input for logging (outside try block so it's available in finally)
    const inputData = {
      prompt,
      options: mergedOptions,
    };

    let response: ExecutionResponse<T> | null = null;
    let executionError: Error | null = null;

    try {
      // Execute CLI with config-level settings (options can override config)
      const result = await executeClaudeCLI(this.cliPath, prompt, {
        verbose: this.config.verbose,
        workingDir: this.config.workingDir,
        ...mergedOptions,
      });

      // Parse output - always use parseStreamOutput since we use stream-json format
      response = await parseStreamOutput<T>(
        result.stdout,
        result.duration,
        result.exitCode,
        mergedOptions.responseSchema
      );

      // Add stderr to raw output
      if (response.raw) {
        response.raw.stderr = result.stderr;
      }
    } catch (error) {
      executionError = error instanceof Error ? error : new Error(String(error));
    } finally {
      // Always log input, even on failure
      if (mergedOptions.logPath) {
        try {
          if (response) {
            // Success case: log everything
            const events = response.raw?.events || [];
            await writeExecutionLogs(mergedOptions.logPath, inputData, response, events);
          } else {
            // Error case: log just the input
            const { mkdir, writeFile } = await import('fs/promises');
            const path = await import('path');
            await mkdir(mergedOptions.logPath, { recursive: true });
            await writeFile(
              path.join(mergedOptions.logPath, 'input.json'),
              JSON.stringify(inputData, null, 2),
              'utf-8'
            );
          }
        } catch (logError) {
          // Logging errors should not break execution
          console.error('[logger] Failed to write execution logs:', logError);
        }
      }
    }

    // Handle errors after logging
    if (executionError) {
      // Check for authentication errors
      if (executionError.message.includes('not authenticated') || executionError.message.includes('no auth token')) {
        throw new AuthenticationError('claude');
      }

      throw new ExecutionError(`Claude execution failed: ${executionError.message}`, {
        name: executionError.name,
        message: executionError.message,
        stack: executionError.stack,
      });
    }

    // Return response if successful
    if (!response) {
      throw new ExecutionError('Execution completed but no response was generated');
    }

    return response;
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
