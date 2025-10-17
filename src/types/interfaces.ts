import type { AdapterResponse, ExecutionOptions } from './config';

/**
 * Adapter capabilities describe what features an adapter supports
 */
export interface AdapterCapabilities {
  /** Whether the adapter supports streaming responses */
  streaming: boolean;
  /** Whether the adapter supports session management and resuming */
  sessionManagement: boolean;
  /** Whether the adapter supports tool/function calling */
  toolCalling: boolean;
  /** Whether the adapter supports multi-modal inputs (images, etc) */
  multiModal: boolean;
}

/**
 * Simplified interface for CLI execution
 * Use this for simple type annotations when you don't need adapter-specific methods
 */
export interface Cli {
  /**
   * Execute a prompt with the CLI
   * @template T The expected type of the output (inferred from responseSchema)
   * @param prompt The prompt/instruction to send to the AI
   * @param options Execution options (streaming, timeout, CLI-specific options)
   * @returns Promise resolving to the adapter response
   */
  execute<T = string>(prompt: string, options?: ExecutionOptions): Promise<AdapterResponse<T>>;
}

/**
 * Common interface that all AI adapters must implement
 * This provides a unified API for interacting with different CLI tools
 */
export interface AIAdapter extends Cli {
  /**
   * Get the capabilities of this adapter
   * @returns The capabilities supported by this adapter
   */
  getCapabilities(): AdapterCapabilities;
}
