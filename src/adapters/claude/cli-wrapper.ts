import { spawn, type ChildProcess } from 'child_process';
import type { ClaudeExecutionOptions } from '../../types/claude.js';
import { ExecutionError, TimeoutError } from '../../core/errors.js';
import boxen from 'boxen';
import chalk from 'chalk';

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

  // Show verbose logging if enabled
  if (options.verbose) {
    const debugInfo = [
      `${chalk.bold('CLI Path:')} ${chalk.cyan(cliPath)}`,
      `${chalk.bold('Args:')} ${chalk.dim(args.join(' '))}`,
      `${chalk.bold('Working Dir:')} ${chalk.yellow(options.workingDir || process.cwd())}`,
      `${chalk.bold('Model:')} ${chalk.green(options.model || 'sonnet')}`,
    ].join('\n');

    const debugBox = boxen(debugInfo, {
      title: '🔧 Executing Claude Code CLI',
      titleAlignment: 'center',
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'blue',
    });

    console.log(debugBox);
  }

  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(cliPath, args, {
      stdio: ['ignore', 'pipe', 'pipe'], // Ignore stdin since we're in -p mode
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
      reject(new ExecutionError(`Failed to spawn Claude CLI: ${error.message}`, {
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
function buildCLIArguments(prompt: string, options: ClaudeExecutionOptions): string[] {
  const args: string[] = [];

  // Use -p flag with prompt (this is the key difference!)
  args.push('-p', prompt);

  // Model
  if (options.model) {
    args.push('--model', options.model);
  }

  // Always use project settings
  args.push('--setting-sources', 'project');

  // Output format - always use stream-json for programmatic usage
  args.push('--output-format', 'stream-json');

  // Verbose is required when using stream-json output format
  args.push('--verbose');

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

  // Skip permissions if enabled
  if (options.dangerouslySkipPermissions) {
    args.push('--dangerously-skip-permissions');
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

  return args;
}
