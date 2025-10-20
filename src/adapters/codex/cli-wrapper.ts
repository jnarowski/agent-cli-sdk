import { spawn } from "child_process";
import type { CodexExecutionOptions } from "../../types/codex";

/**
 * CLI execution result
 */
export interface CLIResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

/**
 * Execute Codex CLI with a prompt
 * @param cliPath Path to codex CLI
 * @param prompt The prompt to execute
 * @param options Execution options
 * @param sessionId Optional session ID for resumption
 * @returns CLI execution result
 */
export async function executeCodexCLI(
  cliPath: string,
  prompt: string,
  options: CodexExecutionOptions = {},
  sessionId?: string
): Promise<CLIResult> {
  const startTime = Date.now();

  // Build command arguments
  const args = buildCodexArgs(prompt, options, sessionId);

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let settled = false; // Prevent race conditions between timeout and process close

    const proc = spawn(cliPath, args, {
      cwd: options.workingDir,
      env: {
        ...process.env,
        // Add any environment variables
      },
    });

    // Collect stdout
    proc.stdout.on("data", (chunk) => {
      const data = chunk.toString();
      stdout += data;

      // Call onOutput callback with raw data
      if (options.onOutput) {
        options.onOutput(data);
      }

      // Call onStream/onEvent callback if provided
      const eventCallback = options.onEvent || options.onStream;
      if (eventCallback) {
        try {
          // Parse JSONL events
          const lines = data.split("\n").filter((line: string) => line.trim());
          for (const line of lines) {
            try {
              const event = JSON.parse(line);
              eventCallback(event);
            } catch {
              // Not JSON, skip
            }
          }
        } catch {
          // Ignore parsing errors
        }
      }
    });

    // Collect stderr
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    // Handle completion
    proc.on("close", (exitCode) => {
      if (settled) return;
      settled = true;

      const duration = Date.now() - startTime;

      resolve({
        stdout,
        stderr,
        exitCode: exitCode ?? 1,
        duration,
      });
    });

    // Handle errors
    proc.on("error", (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    });

    // Handle timeout
    if (options.timeout) {
      setTimeout(() => {
        if (settled) return;
        settled = true;
        proc.kill("SIGTERM");
        reject(new Error(`Execution timed out after ${options.timeout}ms`));
      }, options.timeout);
    }
  });
}

/**
 * Build command arguments for Codex CLI
 * Based on Codex CLI 0.46.0 API
 * @param prompt The prompt to execute
 * @param options Execution options
 * @param sessionId Optional session ID for resumption
 * @returns Array of command arguments
 */
function buildCodexArgs(
  prompt: string,
  options: CodexExecutionOptions,
  sessionId?: string
): string[] {
  const args: string[] = [];

  // Start with 'exec' subcommand
  args.push("exec");

  // Add all flags BEFORE the subcommand arguments

  // Model selection
  if (options.model) {
    args.push("-m", options.model);
  }

  // Sandbox mode
  if (options.sandbox) {
    args.push("-s", options.sandbox);
  }

  // NOTE: Approval policy flags are NOT supported in 'codex exec' mode
  // They're only available in interactive mode
  // Use --full-auto (safe) or --dangerously-bypass-approvals-and-sandbox (unsafe)

  // Full auto mode (convenience flag for programmatic execution)
  if (options.fullAuto) {
    args.push("--full-auto");
  }

  // Dangerous bypass (EXTREMELY DANGEROUS)
  if (options.dangerouslyBypassApprovalsAndSandbox) {
    args.push("--dangerously-bypass-approvals-and-sandbox");
  }

  // Working directory
  if (options.workingDir) {
    args.push("-C", options.workingDir);
  }

  // Images
  if (options.images && options.images.length > 0) {
    for (const image of options.images) {
      args.push("-i", image);
    }
  }

  // Web search
  if (options.search) {
    args.push("--search");
  }

  // Skip git repo check
  if (options.skipGitRepoCheck) {
    args.push("--skip-git-repo-check");
  }

  // Output schema
  if (options.outputSchema) {
    args.push("--output-schema", options.outputSchema);
  }

  // Color setting
  if (options.color) {
    args.push("--color", options.color);
  }

  // JSON output (JSONL streaming)
  if (options.json !== false) {
    // Enable JSON by default for programmatic use
    args.push("--json");
  }

  // Include plan tool
  if (options.includePlanTool) {
    args.push("--include-plan-tool");
  }

  // Output last message to file
  if (options.outputLastMessage) {
    args.push("-o", options.outputLastMessage);
  }

  // Configuration overrides
  if (options.config) {
    for (const [key, value] of Object.entries(options.config)) {
      args.push("-c", `${key}=${JSON.stringify(value)}`);
    }
  }

  // Profile
  if (options.profile) {
    args.push("-p", options.profile);
  }

  // OSS model provider
  if (options.oss) {
    args.push("--oss");
  }

  // Now add the subcommand (resume if sessionId, otherwise just the prompt)
  if (sessionId) {
    args.push("resume", sessionId);
  }

  // Add prompt (always last)
  args.push(prompt);

  return args;
}
