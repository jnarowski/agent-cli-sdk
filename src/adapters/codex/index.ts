import { BaseAdapter } from '../../core/base-adapter';
import type { AdapterCapabilities } from '../../core/interfaces';
import type { AdapterResponse } from '../../types/config';
import type { CodexConfig, CodexExecutionOptions } from '../../types/codex';
import { executeCodexCLI } from './cli-wrapper';
import { parseStreamOutput } from './parser';
import { ExecutionError, AuthenticationError, CLINotFoundError } from '../../core/errors';
import { detectCodexCLI } from './cli-detector';
import { writeExecutionLogs } from '../../utils/logger';

/**
 * Codex adapter implementation
 */
export class CodexAdapter extends BaseAdapter {
  private config: CodexConfig;

  constructor(config: CodexConfig = {}) {
    // Auto-detect CLI path if not provided
    const resolvedPath = config.cliPath || detectCodexCLI();

    if (!resolvedPath) {
      throw new CLINotFoundError(
        'codex',
        'Codex CLI not found. Please install it or provide a cliPath.\n' +
        'Visit https://github.com/openai/openai-codex-cli for installation instructions or set CODEX_CLI_PATH environment variable'
      );
    }

    super(resolvedPath);
    this.config = config;
  }

  /**
   * Execute a prompt with Codex CLI
   */
  async execute(
    prompt: string,
    options: CodexExecutionOptions = {}
  ): Promise<AdapterResponse> {
    // Validate inputs
    this.validatePrompt(prompt);
    this.validateOptions(options);

    // Check authentication if needed
    await this.checkAuthentication();

    // Merge config with options
    const mergedOptions: CodexExecutionOptions = {
      ...options,
    };

    // Set defaults
    if (!mergedOptions.model) {
      mergedOptions.model = 'gpt-5'; // Default to GPT-5
    }

    // Capture input for logging (outside try block so it's available in finally)
    const inputData = {
      prompt,
      options: mergedOptions,
    };

    let response: AdapterResponse | null = null;
    let executionError: Error | null = null;

    try {
      // Execute CLI with config-level settings (options can override config)
      const result = await executeCodexCLI(this.cliPath, prompt, {
        workingDir: this.config.workingDir,
        ...mergedOptions,
      });

      // Always parse as stream output (JSON) to get detailed information
      response = await parseStreamOutput(
        result.stdout,
        result.duration,
        result.exitCode,
        mergedOptions.model,
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
            await writeExecutionLogs(
              mergedOptions.logPath,
              inputData,
              response,
              events
            );
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
      if (
        executionError.message.includes('not logged in') ||
        executionError.message.includes('not authenticated') ||
        executionError.message.includes('login required')
      ) {
        throw new AuthenticationError('codex');
      }

      throw new ExecutionError(
        `Codex execution failed: ${executionError.message}`,
        {
          name: executionError.name,
          message: executionError.message,
          stack: executionError.stack,
        }
      );
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
      sessionManagement: false, // Codex doesn't have explicit session management in the same way as Claude
      toolCalling: true,
      multiModal: true, // Codex supports image inputs via -i flag
    };
  }

  /**
   * Check if Codex CLI is authenticated
   * This is a best-effort check - actual auth errors will be caught during execution
   */
  private async checkAuthentication(): Promise<void> {
    // If API key is provided in config, assume authenticated
    if (this.config.apiKey) {
      return;
    }

    // Otherwise, let the CLI handle authentication
    // The CLI will throw an error if not logged in
  }
}
