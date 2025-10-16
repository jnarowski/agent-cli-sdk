import type { AdapterResponse, ActionLog, StreamEvent } from '../../types/config.js';

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
        details: error,
      },
    };
  }
}

/**
 * Parse streaming JSONL output (from --output-format stream-json)
 */
export function parseStreamOutput(
  output: string,
  duration: number,
  exitCode: number
): AdapterResponse {
  const lines = output.split('\n').filter(line => line.trim());
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

  return {
    output: finalOutput,
    sessionId,
    status: exitCode === 0 ? 'success' : 'error',
    exitCode,
    duration,
    actions,
    metadata: {
      model,
      toolsUsed: Array.from(toolsUsed),
      filesModified: Array.from(filesModified),
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
function extractOutputText(parsed: any): string {
  if (typeof parsed === 'string') {
    return parsed;
  }

  // Try various common fields (Claude CLI returns 'result')
  if (parsed.result) return parsed.result;
  if (parsed.output) return parsed.output;
  if (parsed.message) return parsed.message;
  if (parsed.content) return parsed.content;
  if (parsed.text) return parsed.text;

  // If it's an array of messages, concatenate them
  if (Array.isArray(parsed.messages)) {
    return parsed.messages.map((m: any) => m.content || m.text || '').join('\n');
  }

  return JSON.stringify(parsed, null, 2);
}

/**
 * Extract actions from parsed output
 */
function extractActions(parsed: any): ActionLog[] {
  const actions: ActionLog[] = [];

  if (parsed.actions && Array.isArray(parsed.actions)) {
    return parsed.actions.map((action: any) => ({
      timestamp: action.timestamp || Date.now(),
      type: action.type || 'think',
      target: action.target || action.path || action.command,
      content: action.content,
      result: action.result || 'success',
      metadata: action.metadata,
    }));
  }

  if (parsed.toolCalls && Array.isArray(parsed.toolCalls)) {
    return parsed.toolCalls.map((tool: any) => ({
      timestamp: tool.timestamp || Date.now(),
      type: mapToolToActionType(tool.name),
      target: tool.target || tool.path,
      content: tool.content,
      result: 'success',
      metadata: { toolName: tool.name },
    }));
  }

  return actions;
}

/**
 * Extract metadata from parsed output
 */
function extractMetadata(parsed: any): any {
  const metadata: any = {};

  // Check if metadata is nested in a metadata object
  const metaSource = parsed.metadata || parsed;

  if (metaSource.model) metadata.model = metaSource.model;
  if (metaSource.tokensUsed || metaSource.tokens_used) {
    metadata.tokensUsed = metaSource.tokensUsed || metaSource.tokens_used;
  }
  if (metaSource.toolsUsed || metaSource.tools_used) {
    metadata.toolsUsed = metaSource.toolsUsed || metaSource.tools_used;
  }
  if (metaSource.filesModified || metaSource.files_modified) {
    metadata.filesModified = metaSource.filesModified || metaSource.files_modified;
  }
  if (metaSource.duration) {
    metadata.duration = metaSource.duration;
  }

  return metadata;
}

/**
 * Normalize stream event to standard format
 */
function normalizeStreamEvent(event: any): StreamEvent {
  return {
    type: event.type || 'message.chunk',
    timestamp: event.timestamp || Date.now(),
    data: {
      content: event.content || event.message,
      toolName: event.toolName || event.tool_name,
      metadata: event.metadata || event,
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
