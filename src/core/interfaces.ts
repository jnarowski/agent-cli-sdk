import type { AdapterResponse, ExecutionOptions } from '../types/config.js';

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
 * Common interface that all AI adapters must implement
 * This provides a unified API for interacting with different CLI tools
 */
export interface AIAdapter {
  /**
   * Execute a prompt with the AI adapter
   * @param prompt The prompt/instruction to send to the AI
   * @param options Execution options (streaming, timeout, CLI-specific options)
   * @returns Promise resolving to the adapter response
   */
  execute(prompt: string, options?: ExecutionOptions): Promise<AdapterResponse>;

  /**
   * Get the capabilities of this adapter
   * @returns The capabilities supported by this adapter
   */
  getCapabilities(): AdapterCapabilities;
}
