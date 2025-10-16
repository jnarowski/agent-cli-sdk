import { spawn, type ChildProcess } from 'child_process';
import type { ClaudeExecutionOptions } from '../../types/claude.js';
import { ExecutionError, TimeoutError } from '../../core/errors.js';

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

/**
 * Spawn the Claude CLI process with given arguments
 */
export async function executeClaudeCLI(
  cliPath: string,
  prompt: string,
  options: ClaudeExecutionOptions = {}
): Promise<CLIResult> {
  const args = buildCLIArguments(prompt, options);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Set up timeout if specified
    let timeoutId: NodeJS.Timeout | undefined;
    if (options.timeout) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        reject(
          new TimeoutError(
            `Claude CLI execution timed out after ${options.timeout}ms`,
            options.sessionId,
            stdout
          )
        );
      }, options.timeout);
    }

    // Collect stdout
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        const chunk = data.toString();
        stdout += chunk;

        // Call streaming callback if provided
        if (options.streaming && options.onStream) {
          try {
            // Parse JSONL events
            const lines = chunk.split('\n').filter(line => line.trim());
            for (const line of lines) {
              try {
                const event = JSON.parse(line);
                options.onStream(event);
              } catch {
                // Not a JSON line, skip
              }
            }
          } catch (error) {
            // Ignore parsing errors during streaming
          }
        }
      });
    }

    // Collect stderr
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
    }

    // Handle process exit
    child.on('close', (code: number | null) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (timedOut) {
        return; // Already rejected with TimeoutError
      }

      const duration = Date.now() - startTime;
      const exitCode = code ?? 1;

      if (exitCode !== 0 && !timedOut) {
        reject(
          new ExecutionError(
            `Claude CLI exited with code ${exitCode}`,
            { exitCode, stderr, stdout }
          )
        );
      } else {
        resolve({ stdout, stderr, exitCode, duration });
      }
    });

    // Handle spawn errors
    child.on('error', (error: Error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      reject(new ExecutionError(`Failed to spawn Claude CLI: ${error.message}`, error));
    });
  });
}

/**
 * Build CLI arguments from execution options
 */
function buildCLIArguments(prompt: string, options: ClaudeExecutionOptions): string[] {
  const args: string[] = [];

  // Always use --print mode for programmatic usage
  args.push('--print');

  // Output format
  const outputFormat = options.streaming ? 'stream-json' : (options.outputFormat || 'json');
  args.push('--output-format', outputFormat);

  // Model
  if (options.model) {
    args.push('--model', options.model);
  }

  // Fallback model
  if (options.fallbackModel) {
    args.push('--fallback-model', options.fallbackModel);
  }

  // System prompts
  if (options.systemPrompt) {
    args.push('--system-prompt', options.systemPrompt);
  }
  if (options.appendSystemPrompt) {
    args.push('--append-system-prompt', options.appendSystemPrompt);
  }

  // Session management
  if (options.sessionId) {
    args.push('--session-id', options.sessionId);
  }

  // Permission mode
  if (options.permissionMode) {
    args.push('--permission-mode', options.permissionMode);
  }

  // Allowed/disallowed tools
  if (options.allowedTools && options.allowedTools.length > 0) {
    args.push('--allowed-tools', options.allowedTools.join(' '));
  }
  if (options.disallowedTools && options.disallowedTools.length > 0) {
    args.push('--disallowed-tools', options.disallowedTools.join(' '));
  }

  // Include partial messages for streaming
  if (options.streaming && options.includePartialMessages) {
    args.push('--include-partial-messages');
  }

  // Finally, add the prompt
  args.push(prompt);

  return args;
}
