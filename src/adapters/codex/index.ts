import { BaseAdapter } from '../../core/base-adapter.js';
import type { AdapterCapabilities } from '../../core/interfaces.js';
import type { AdapterResponse } from '../../types/config.js';
import type { CodexConfig, CodexExecutionOptions } from '../../types/codex.js';
import { executeCodexCLI } from './cli-wrapper.js';
import { parseTextOutput, parseStreamOutput } from './parser.js';
import { ExecutionError, AuthenticationError } from '../../core/errors.js';

/**
 * Codex adapter implementation
 */
export class CodexAdapter extends BaseAdapter {
  private config: CodexConfig;

  constructor(cliPath: string, config: CodexConfig = {}) {
    super(cliPath);
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

    try {
      // Execute CLI
      const result = await executeCodexCLI(this.cliPath, prompt, mergedOptions);

      // Parse output based on streaming mode
      let response: AdapterResponse;
      if (mergedOptions.streaming) {
        response = parseStreamOutput(result.stdout, result.duration, result.exitCode);
      } else {
        response = parseTextOutput(result.stdout, result.duration, result.exitCode);
      }

      // Add stderr to raw output
      if (response.raw) {
        response.raw.stderr = result.stderr;
      }

      return response;
    } catch (error) {
      // Handle specific errors
      if (error instanceof Error) {
        // Check for authentication errors
        if (
          error.message.includes('not logged in') ||
          error.message.includes('not authenticated') ||
          error.message.includes('login required')
        ) {
          throw new AuthenticationError('codex');
        }

        throw new ExecutionError(
          `Codex execution failed: ${error.message}`,
          error
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
