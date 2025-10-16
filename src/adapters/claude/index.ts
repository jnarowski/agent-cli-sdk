import { BaseAdapter } from '../../core/base-adapter.js';
import type { AdapterCapabilities } from '../../core/interfaces.js';
import type { AdapterResponse } from '../../types/config.js';
import type { ClaudeConfig, ClaudeExecutionOptions } from '../../types/claude.js';
import { executeClaudeCLI } from './cli-wrapper.js';
import { parseJSONOutput, parseStreamOutput } from './parser.js';
import { ExecutionError, AuthenticationError } from '../../core/errors.js';

/**
 * Claude Code adapter implementation
 */
export class ClaudeAdapter extends BaseAdapter {
  private config: ClaudeConfig;

  constructor(cliPath: string, config: ClaudeConfig = {}) {
    super(cliPath);
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

    // Merge config with options
    const mergedOptions: ClaudeExecutionOptions = {
      ...options,
    };

    // Set defaults
    if (!mergedOptions.model) {
      mergedOptions.model = 'sonnet'; // Default to latest Sonnet
    }

    try {
      // Execute CLI
      const result = await executeClaudeCLI(this.cliPath, prompt, mergedOptions);

      // Parse output based on streaming mode
      let response: AdapterResponse;
      if (mergedOptions.streaming) {
        response = parseStreamOutput(result.stdout, result.duration, result.exitCode);
      } else {
        response = parseJSONOutput(result.stdout, result.duration, result.exitCode);
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
          error.message.includes('not authenticated') ||
          error.message.includes('no auth token')
        ) {
          throw new AuthenticationError('claude');
        }

        throw new ExecutionError(
          `Claude execution failed: ${error.message}`,
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
