import type { AdapterResponse, ActionLog, StreamEvent, StreamEventType } from '../../types/config';
import { extractJsonFromOutput, validateWithSchema } from '../../utils/json-parser';

/**
 * Parse Claude CLI JSON output (from --output-format json)
 */
export function parseJSONOutput(output: string, duration: number, exitCode: number): AdapterResponse {
  try {
    const parsed = JSON.parse(output);

    // Extract the final output text
    const outputText = extractOutputText(parsed);

    // Extract session ID
    const sessionId = parsed.sessionId || parsed.session_id || '';

    // Extract actions/tool calls
    const actions = extractActions(parsed);

    // Extract metadata
    const metadata = extractMetadata(parsed);

    return {
      output: outputText,
      sessionId,
      status: exitCode === 0 ? 'success' : 'error',
      exitCode,
      duration,
      actions,
      metadata,
      raw: {
        stdout: output,
        stderr: '',
      },
    };
  } catch (error) {
    // Failed to parse JSON, return raw output
    return {
      output,
      sessionId: '',
      status: exitCode === 0 ? 'success' : 'error',
      exitCode,
      duration,
      metadata: {},
      raw: {
        stdout: output,
        stderr: '',
      },
      error: {
        code: 'PARSE_ERROR',
        message: 'Failed to parse Claude CLI output',
        details:
          error instanceof Error
            ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
              }
            : typeof error === 'object' && error !== null
              ? (error as Record<string, unknown>)
              : { error: String(error) },
      },
    };
  }
}

/**
 * Parse streaming JSONL output (from --output-format stream-json)
 * Also handles single JSON object responses for testing/compatibility
 */
export async function parseStreamOutput(
  output: string,
  duration: number,
  exitCode: number,
  responseSchema?: true | { safeParse: (data: unknown) => unknown }
): Promise<AdapterResponse> {
  // First, try to parse as a single JSON object (for fixtures and some CLI responses)
  try {
    const parsed = JSON.parse(output);
    // If it's a single object with expected fields, use JSON parser
    if (
      parsed &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      (parsed.output || parsed.messages || parsed.result || parsed.status)
    ) {
      return parseJSONOutput(output, duration, exitCode);
    }
  } catch {
    // Not a single JSON object, continue with JSONL parsing
  }

  const lines = output.split('\n').filter((line) => line.trim());
  const events: StreamEvent[] = [];
  const actions: ActionLog[] = [];
  const toolsUsed = new Set<string>();
  const filesModified = new Set<string>();
  let finalOutput = '';
  let sessionId = '';
  let model = '';

  for (const line of lines) {
    try {
      const event = JSON.parse(line);

      // Store raw event
      events.push(normalizeStreamEvent(event));

      // Extract session ID
      if (event.sessionId || event.session_id) {
        sessionId = event.sessionId || event.session_id;
      }
      if (event.session_id) {
        sessionId = event.session_id;
      }

      // Extract model
      if (event.model) {
        model = event.model;
      }

      // Extract final result message (this is the key output from Claude CLI)
      if (event.type === 'result' && event.result) {
        finalOutput = event.result;
      }

      // Extract message content from assistant messages
      if (event.type === 'assistant' && event.message?.content) {
        const content = event.message.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'text' && block.text) {
              finalOutput += block.text;
            }
          }
        }
      }

      // Legacy: Extract final message content
      if (event.type === 'message.chunk' && event.content) {
        finalOutput += event.content;
      }
      if (event.type === 'turn.completed' && event.message) {
        finalOutput = event.message;
      }

      // Extract tool calls from assistant message content
      if (event.type === 'assistant' && event.message?.content) {
        const content = event.message.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block.type === 'tool_use' && block.name) {
              toolsUsed.add(block.name);
              actions.push({
                timestamp: event.timestamp || Date.now(),
                type: mapToolToActionType(block.name),
                target: block.input?.file_path || block.input?.path || block.input?.command,
                content: JSON.stringify(block.input),
                result: 'success',
                metadata: { toolName: block.name, toolId: block.id },
              });

              // Track file modifications for Write and Edit tools
              if (block.name === 'Write' && block.input?.file_path) {
                filesModified.add(block.input.file_path);
              }
              if (block.name === 'Edit' && block.input?.file_path) {
                filesModified.add(block.input.file_path);
              }
            }
          }
        }
      }

      // Legacy: Extract tool calls from old event format
      if (event.type === 'tool.started' && event.toolName) {
        toolsUsed.add(event.toolName);
        actions.push({
          timestamp: event.timestamp || Date.now(),
          type: mapToolToActionType(event.toolName),
          target: event.target || event.path || event.command,
          content: event.content,
          result: 'success',
          metadata: { toolName: event.toolName },
        });
      }

      // Legacy: Extract file modifications from old event format
      if (event.type === 'tool.completed' && event.toolName === 'Edit' && event.path) {
        filesModified.add(event.path);
      }
      if (event.type === 'tool.completed' && event.toolName === 'Write' && event.path) {
        filesModified.add(event.path);
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  // If no JSONL events were found and finalOutput is empty, use the original output as fallback
  if (!finalOutput && output) {
    finalOutput = output;
  }

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
      toolsUsed: Array.from(toolsUsed),
      filesModified: Array.from(filesModified),
      validation: validationMetadata,
    },
    raw: {
      stdout: output,
      stderr: '',
      events,
    },
  };
}

/**
 * Extract output text from various Claude response formats
 */
function extractOutputText(parsed: unknown): string {
  if (typeof parsed === 'string') {
    return parsed;
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return String(parsed);
  }

  const obj = parsed as Record<string, unknown>;

  // Try various common fields (Claude CLI returns 'result')
  if (typeof obj.result === 'string') return obj.result;
  if (typeof obj.output === 'string') return obj.output;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.content === 'string') return obj.content;
  if (typeof obj.text === 'string') return obj.text;

  // If it's an array of messages, concatenate them
  if (Array.isArray(obj.messages)) {
    return obj.messages
      .map((m: unknown) => {
        if (typeof m === 'object' && m !== null) {
          const msg = m as Record<string, unknown>;
          const content = typeof msg.content === 'string' ? msg.content : '';
          const text = typeof msg.text === 'string' ? msg.text : '';
          return content || text;
        }
        return '';
      })
      .join('\n');
  }

  return JSON.stringify(parsed, null, 2);
}

/**
 * Extract actions from parsed output
 */
function extractActions(parsed: unknown): ActionLog[] {
  const actions: ActionLog[] = [];

  if (typeof parsed !== 'object' || parsed === null) {
    return actions;
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.actions && Array.isArray(obj.actions)) {
    return obj.actions.map((action: unknown) => {
      const act = action as Record<string, unknown>;
      const typeStr = typeof act.type === 'string' ? act.type : 'think';
      const targetStr =
        typeof act.target === 'string'
          ? act.target
          : typeof act.path === 'string'
            ? act.path
            : typeof act.command === 'string'
              ? act.command
              : '';
      return {
        timestamp: typeof act.timestamp === 'number' ? act.timestamp : Date.now(),
        type: mapToolToActionType(typeStr),
        target: targetStr,
        content: act.content as string | undefined,
        result: (act.result as ActionLog['result']) || 'success',
        metadata: act.metadata as Record<string, unknown> | undefined,
      };
    });
  }

  if (obj.toolCalls && Array.isArray(obj.toolCalls)) {
    return obj.toolCalls.map((tool: unknown) => {
      const t = tool as Record<string, unknown>;
      const nameStr = typeof t.name === 'string' ? t.name : '';
      const targetStr = typeof t.target === 'string' ? t.target : typeof t.path === 'string' ? t.path : '';
      return {
        timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now(),
        type: mapToolToActionType(nameStr),
        target: targetStr,
        content: t.content as string | undefined,
        result: 'success' as const,
        metadata: { toolName: t.name },
      };
    });
  }

  return actions;
}

/**
 * Extract metadata from parsed output
 */
function extractMetadata(parsed: unknown): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  if (typeof parsed !== 'object' || parsed === null) {
    return metadata;
  }

  const obj = parsed as Record<string, unknown>;

  // Check if metadata is nested in a metadata object
  const metaSource = (obj.metadata as Record<string, unknown>) || obj;

  if (typeof metaSource.model === 'string') metadata.model = metaSource.model;
  if (typeof metaSource.tokensUsed === 'number' || typeof metaSource.tokens_used === 'number') {
    metadata.tokensUsed = metaSource.tokensUsed || metaSource.tokens_used;
  }
  if (metaSource.toolsUsed || metaSource.tools_used) {
    metadata.toolsUsed = metaSource.toolsUsed || metaSource.tools_used;
  }
  if (metaSource.filesModified || metaSource.files_modified) {
    metadata.filesModified = metaSource.filesModified || metaSource.files_modified;
  }
  if (typeof metaSource.duration === 'number') {
    metadata.duration = metaSource.duration;
  }

  return metadata;
}

/**
 * Normalize stream event to standard format
 */
function normalizeStreamEvent(event: unknown): StreamEvent {
  if (typeof event !== 'object' || event === null) {
    return {
      type: 'message.chunk',
      timestamp: Date.now(),
      data: {},
    };
  }

  const evt = event as Record<string, unknown>;

  return {
    type: (evt.type as StreamEventType) || 'message.chunk',
    timestamp: typeof evt.timestamp === 'number' ? evt.timestamp : Date.now(),
    data: {
      content: (evt.content as string | undefined) || (evt.message as string | undefined),
      toolName: (evt.toolName as string | undefined) || (evt.tool_name as string | undefined),
      metadata: (evt.metadata as Record<string, unknown>) || evt,
    },
  };
}

/**
 * Map Claude tool names to action types
 */
function mapToolToActionType(toolName: string): ActionLog['type'] {
  const lower = toolName.toLowerCase();
  if (lower.includes('read')) return 'read';
  if (lower.includes('write')) return 'write';
  if (lower.includes('edit')) return 'edit';
  if (lower.includes('bash') || lower.includes('command')) return 'bash';
  if (lower.includes('search') || lower.includes('grep')) return 'search';
  return 'think';
}
