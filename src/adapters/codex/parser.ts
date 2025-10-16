import type { AdapterResponse, ActionLog, StreamEvent } from '../../types/config.js';

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
export function parseStreamOutput(
  output: string,
  duration: number,
  exitCode: number
): AdapterResponse {
  const lines = output.split('\n').filter(line => line.trim());
  const events: StreamEvent[] = [];
  const actions: ActionLog[] = [];
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

      // Extract model
      if (event.model) {
        model = event.model;
      }

      // Handle turn events
      if (event.type === 'turn.started') {
        // Turn started
      } else if (event.type === 'turn.completed') {
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
        actions.push({
          timestamp: event.timestamp || Date.now(),
          type: mapOperationToActionType(event.operation || event.tool),
          target: event.target || event.path || event.command,
          content: event.content,
          result: 'success',
          metadata: event,
        });
      } else if (event.type === 'item.completed') {
        // Item completed - update action result
        if (event.path) {
          filesModified.add(event.path);
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

  return {
    output: finalOutput,
    sessionId,
    status: exitCode === 0 ? 'success' : 'error',
    exitCode,
    duration,
    actions,
    metadata: {
      model,
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
 * Normalize stream event to standard format
 */
function normalizeStreamEvent(event: Record<string, unknown>): StreamEvent {
  return {
    type: mapCodexEventType(event.type as string),
    timestamp: (event.timestamp as number) || Date.now(),
    data: {
      content: (event.content || event.message || event.output) as string | undefined,
      toolName: (event.tool || event.operation) as string | undefined,
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
    'message': 'message.chunk',
    'chunk': 'message.chunk',
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
