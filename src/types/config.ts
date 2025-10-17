/**
 * Stream event types that can be emitted during execution
 */
export type StreamEventType =
  | 'turn.started'
  | 'turn.completed'
  | 'turn.failed'
  | 'tool.started'
  | 'tool.completed'
  | 'message.chunk'
  | 'item.started'
  | 'item.updated'
  | 'item.completed';

/**
 * Stream event emitted during execution
 */
export interface StreamEvent {
  /** Type of the event */
  type: StreamEventType;
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Event data */
  data: {
    /** Partial message content (for message.chunk events) */
    content?: string;
    /** Tool being executed (for tool events) */
    toolName?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
  };
}

/**
 * Action log entry for operations performed by the AI
 */
export interface ActionLog {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  /** Type of action performed */
  type: 'read' | 'write' | 'edit' | 'bash' | 'search' | 'think';
  /** Target of the action (file path, command, etc.) */
  target?: string;
  /** Content or description of what was done */
  content?: string;
  /** Result of the action */
  result?: 'success' | 'error';
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Response status
 */
export type ResponseStatus = 'success' | 'error' | 'timeout';

/**
 * Token usage details
 */
export interface TokenUsage {
  /** Input tokens used */
  inputTokens?: number;
  /** Output tokens generated */
  outputTokens?: number;
  /** Cached input tokens (prompt caching) */
  cacheReadInputTokens?: number;
  /** Cache creation input tokens */
  cacheCreationInputTokens?: number;
  /** Total tokens (input + output) */
  totalTokens?: number;
  /** Web search requests made (if applicable) */
  webSearchRequests?: number;
}

/**
 * Per-model usage breakdown
 */
export interface ModelUsage extends TokenUsage {
  /** Cost in USD for this model */
  costUSD?: number;
  /** Context window size */
  contextWindow?: number;
}

/**
 * Standard response from an adapter
 * @template T The type of the output (inferred from responseSchema)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AdapterResponse<T = string | Record<string, any>> {
  /** Final output from the AI (string or parsed JSON object if responseSchema used) */
  output: T;
  /** Session ID for resuming (if supported) */
  sessionId: string;
  /** Status of the execution */
  status: ResponseStatus;
  /** Exit code from the CLI process */
  exitCode: number;
  /** Duration of execution in milliseconds */
  duration: number;
  /** Array of actions/operations performed */
  actions?: ActionLog[];
  /** Response metadata */
  metadata: {
    /** Model used for execution */
    model?: string;
    /** Tokens consumed (if available) */
    tokensUsed?: number;
    /** Tools/functions that were called */
    toolsUsed?: string[];
    /** Files that were modified */
    filesModified?: string[];
    /** JSON parsing and validation results (when responseSchema is used) */
    validation?: {
      /** Whether validation succeeded */
      success: boolean;
      /** Validation error messages (if validation failed) */
      errors?: string[];
    };
  };
  /** Detailed token usage information */
  usage?: TokenUsage;
  /** Per-model usage breakdown (for multi-model scenarios) */
  modelUsage?: Record<string, ModelUsage>;
  /** Total cost in USD */
  totalCostUSD?: number;
  /** Raw CLI output */
  raw?: {
    /** Raw stdout from CLI */
    stdout: string;
    /** Raw stderr from CLI */
    stderr: string;
    /** All stream events if streaming was enabled */
    events?: StreamEvent[];
  };
  /** Error information if status is 'error' */
  error?: {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** Additional error details */
    details?: Record<string, unknown>;
  };
}

/**
 * Execution options common to all adapters
 */
export interface ExecutionOptions {
  /** Enable streaming mode */
  streaming?: boolean;
  /** Callback for stream events (called in real-time) */
  onStream?: (event: StreamEvent) => void;
  /** Session ID for resuming a previous session */
  sessionId?: string;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Enable verbose debug output */
  verbose?: boolean;
  /** Optional path to directory for logging this execution's input, output, and stream events */
  logPath?: string;
  /**
   * Optional schema for validating and parsing JSON response
   * - Pass `true` to enable JSON extraction without validation
   * - Pass a Zod schema to validate structure (requires zod peer dependency)
   * - When provided, automatically extracts JSON from CLI output
   * - Original text preserved in response.raw.stdout
   */
  responseSchema?: true | { safeParse: (data: unknown) => unknown };
}

/**
 * Base configuration for all adapters
 */
export interface AdapterConfig {
  /** CLI binary path (auto-detected if not specified) */
  cliPath?: string;
  /** Additional configuration options */
  [key: string]: unknown;
}
