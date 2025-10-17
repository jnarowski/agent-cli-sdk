import type { AdapterResponse, ActionLog, StreamEvent } from '../../types/config';
import { extractJsonFromOutput, validateWithSchema } from '../../utils/json-parser';

/**
 * Parse Codex CLI output (text output)
 */
export function parseTextOutput(output: string, duration: number, exitCode: number): AdapterResponse {
  return {
    output,
    sessionId: '', // Codex doesn't return session ID in text mode
    status: exitCode === 0 ? 'success' : 'error',
    exitCode,
    duration,
    metadata: {},
    raw: {
      stdout: output,
      stderr: '',
    },
  };
}

/**
 * Parse Codex JSONL event stream (from --json flag)
 */
export async function parseStreamOutput(
  output: string,
  duration: number,
  exitCode: number,
  modelName?: string,
  responseSchema?: true | { safeParse: (data: unknown) => unknown }
): Promise<AdapterResponse> {
  const lines = output.split('\n').filter((line) => line.trim());
  const events: StreamEvent[] = [];
  const actions: ActionLog[] = [];
  const filesModified = new Set<string>();
  let finalOutput = '';
  let sessionId = '';
  let model = modelName || ''; // Use provided model name, or try to detect from events

  // Usage tracking
  let inputTokens = 0;
  let outputTokens = 0;
  let cachedInputTokens = 0;

  for (const line of lines) {
    try {
      const event = JSON.parse(line);

      // Store raw event
      events.push(normalizeStreamEvent(event));

      // Extract thread ID (Codex's equivalent of session ID)
      if (event.thread_id) {
        sessionId = event.thread_id;
      }

      // Extract session ID
      if (event.sessionId || event.session_id) {
        sessionId = event.sessionId || event.session_id;
      }

      // Extract model
      if (event.model) {
        model = event.model;
      }

      // Handle turn events
      if (event.type === 'turn.started') {
        // Turn started
      } else if (event.type === 'turn.completed') {
        // Extract usage information from turn.completed event
        if (event.usage) {
          inputTokens += event.usage.input_tokens || 0;
          outputTokens += event.usage.output_tokens || 0;
          cachedInputTokens += event.usage.cached_input_tokens || 0;
        }

        // Extract final output
        if (event.output || event.message || event.content) {
          finalOutput = event.output || event.message || event.content;
        }
      } else if (event.type === 'turn.failed') {
        // Turn failed - capture error
        finalOutput = event.error || event.message || 'Turn failed';
      }

      // Handle item events (tool calls, operations)
      if (event.type === 'item.started') {
        // Item started - track as action
        const item = event.item || event;
        actions.push({
          timestamp: event.timestamp || Date.now(),
          type: mapOperationToActionType(item.type || event.operation || event.tool),
          target: item.command || event.target || event.path || event.command,
          content: item.text || event.content,
          result: 'success',
          metadata: event,
        });
      } else if (event.type === 'item.updated') {
        // Item updated - accumulate content from message updates
        const data = event.data || event;
        if (data.content) {
          finalOutput += data.content;
        }
      } else if (event.type === 'item.completed') {
        // Item completed - update action result
        const item = event.item || event;

        // Extract file modifications from commands or paths
        if (item.path || event.path) {
          filesModified.add(item.path || event.path);
        }

        // Capture final output from agent messages
        if (item.type === 'agent_message' && item.text) {
          if (!finalOutput) {
            finalOutput = item.text;
          }
        }
      }

      // Handle message chunks
      if (event.type === 'message.chunk' && event.content) {
        finalOutput += event.content;
      }

      // Extract file modifications from diffs
      if (event.type === 'diff' || event.type === 'file.modified') {
        if (event.path || event.file) {
          filesModified.add(event.path || event.file);
        }
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  // If no JSONL events were found and finalOutput is empty, use the original output as fallback
  if (!finalOutput && output) {
    finalOutput = output;
  }

  const totalTokens = inputTokens + outputTokens;

  // Calculate usage
  const usage =
    totalTokens > 0
      ? {
          inputTokens,
          outputTokens,
          cacheReadInputTokens: cachedInputTokens,
          totalTokens,
        }
      : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedOutput: string | Record<string, any> = finalOutput;
  let validationMetadata: { success: boolean; errors?: string[] } | undefined;

  // Handle responseSchema if provided
  if (responseSchema) {
    const extracted = extractJsonFromOutput(finalOutput);

    if (extracted === null) {
      // No JSON found - return empty object
      parsedOutput = {};
      validationMetadata = {
        success: false,
        errors: ['No JSON found in output'],
      };
    } else if (responseSchema === true) {
      // JSON extraction only (no validation)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parsedOutput = extracted as Record<string, any>;
      validationMetadata = { success: true };
    } else {
      // Validate with schema
      const validation = await validateWithSchema(extracted, responseSchema);
      parsedOutput = validation.data ?? extracted;
      validationMetadata = {
        success: validation.success,
        errors: validation.errors,
      };
    }
  }

  return {
    output: parsedOutput,
    sessionId,
    status: exitCode === 0 ? 'success' : 'error',
    exitCode,
    duration,
    actions,
    metadata: {
      model,
      filesModified: Array.from(filesModified),
      tokensUsed: totalTokens > 0 ? totalTokens : undefined,
      validation: validationMetadata,
    },
    usage,
    raw: {
      stdout: output,
      stderr: '',
      events,
    },
  };
}

/**
 * Normalize stream event to standard format
 * Preserves the complete original event in metadata
 */
function normalizeStreamEvent(event: Record<string, unknown>): StreamEvent {
  return {
    type: mapCodexEventType(event.type as string),
    timestamp: (event.timestamp as number) || Date.now(),
    data: {
      content: (event.content || event.message || event.output) as string | undefined,
      toolName: (event.tool || event.operation) as string | undefined,
      // Preserve the complete original event object for full transparency
      metadata: event,
    },
  };
}

/**
 * Map Codex event types to our standard event types
 */
function mapCodexEventType(type: string): StreamEvent['type'] {
  const mapping: Record<string, StreamEvent['type']> = {
    'turn.started': 'turn.started',
    'turn.completed': 'turn.completed',
    'turn.failed': 'turn.failed',
    'item.started': 'item.started',
    'item.updated': 'item.updated',
    'item.completed': 'item.completed',
    'tool.started': 'tool.started',
    'tool.completed': 'tool.completed',
    message: 'message.chunk',
    chunk: 'message.chunk',
  };

  return mapping[type] || 'message.chunk';
}

/**
 * Map Codex operations to action types
 */
function mapOperationToActionType(operation?: string): ActionLog['type'] {
  if (!operation) return 'think';

  const lower = operation.toLowerCase();
  if (lower.includes('read') || lower.includes('cat')) return 'read';
  if (lower.includes('write') || lower.includes('create')) return 'write';
  if (lower.includes('edit') || lower.includes('modify') || lower.includes('patch')) return 'edit';
  if (lower.includes('bash') || lower.includes('command') || lower.includes('exec')) return 'bash';
  if (lower.includes('search') || lower.includes('grep') || lower.includes('find')) return 'search';
  return 'think';
}
