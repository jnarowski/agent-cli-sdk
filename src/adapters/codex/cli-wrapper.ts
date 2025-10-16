import { spawn, type ChildProcess } from 'child_process';
import type { CodexExecutionOptions } from '../../types/codex.js';
import { ExecutionError, TimeoutError } from '../../core/errors.js';

export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

/**
 * Spawn the Codex CLI process with given arguments
 */
export async function executeCodexCLI(
  cliPath: string,
  prompt: string,
  options: CodexExecutionOptions = {}
): Promise<CLIResult> {
  const args = buildCLIArguments(prompt, options);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      cwd: options.workingDir,
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
            `Codex CLI execution timed out after ${options.timeout}ms`,
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
          } catch {
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
            `Codex CLI exited with code ${exitCode}`,
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
      reject(new ExecutionError(`Failed to spawn Codex CLI: ${error.message}`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      }));
    });
  });
}

/**
 * Build CLI arguments from execution options
 */
function buildCLIArguments(prompt: string, options: CodexExecutionOptions): string[] {
  const args: string[] = [];

  // Use 'exec' subcommand for non-interactive execution
  args.push('exec');

  // Model
  if (options.model) {
    args.push('-m', options.model);
  }

  // Working directory
  if (options.workingDir) {
    args.push('-C', options.workingDir);
  }

  // Full auto mode (convenience)
  if (options.fullAuto) {
    args.push('--full-auto');
  } else {
    // Sandbox mode
    if (options.sandbox) {
      args.push('-s', options.sandbox);
    }

    // Approval policy
    if (options.approvalPolicy) {
      args.push('-a', options.approvalPolicy);
    }
  }

  // Web search
  if (options.enableSearch) {
    args.push('--search');
  }

  // Image inputs
  if (options.images && options.images.length > 0) {
    for (const image of options.images) {
      args.push('-i', image);
    }
  }

  // Configuration overrides
  if (options.configOverrides) {
    for (const [key, value] of Object.entries(options.configOverrides)) {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      args.push('-c', `${key}=${jsonValue}`);
    }
  }

  // Configuration profile
  if (options.profile) {
    args.push('-p', options.profile);
  }

  // Add JSON output flag if streaming
  if (options.streaming) {
    args.push('--json');
  }

  // Finally, add the prompt
  args.push(prompt);

  return args;
}
