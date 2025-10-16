import { execSync } from 'child_process';
import { existsSync } from 'fs';

/**
 * Find a CLI binary in the system PATH or use environment variable override
 * @param command The CLI command name ('claude' or 'codex')
 * @returns Full path to the CLI binary or null if not found
 */
export function findCLI(command: 'claude' | 'codex'): string | null {
  // 1. Check environment variable override first
  const envVar = command === 'claude' ? 'CLAUDE_CLI_PATH' : 'CODEX_CLI_PATH';
  const envPath = process.env[envVar];

  if (envPath) {
    // Verify the path exists
    if (existsSync(envPath)) {
      return envPath;
    } else {
      console.warn(`${envVar} is set but path does not exist: ${envPath}`);
    }
  }

  // 2. Auto-detect in PATH
  try {
    const whichCommand = process.platform === 'win32' ? 'where' : 'which';
    const result = execSync(`${whichCommand} ${command}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    }).trim();

    // Return first match (in case multiple are found)
    const paths = result.split('\n');
    return paths[0] || null;
  } catch {
    // Command not found in PATH
    return null;
  }
}

/**
 * Check if a CLI is installed and available
 * @param command The CLI command name
 * @returns True if the CLI is installed and in PATH
 */
export function isCLIInstalled(command: 'claude' | 'codex'): boolean {
  return findCLI(command) !== null;
}
