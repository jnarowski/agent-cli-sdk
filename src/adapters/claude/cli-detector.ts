import { execSync } from 'child_process';
import { existsSync, accessSync, constants } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Common installation locations for Claude CLI
 */
const CLAUDE_CLI_LOCATIONS = [
  // NPM global installation
  '/usr/local/bin/claude',
  // Homebrew
  '/opt/homebrew/bin/claude',
  '/usr/local/Homebrew/bin/claude',
  // User home directory installations
  join(homedir(), '.local', 'bin', 'claude'),
  join(homedir(), 'bin', 'claude'),
  // Node.js global modules
  join(homedir(), '.npm-global', 'bin', 'claude'),
  // Windows locations
  join(homedir(), 'AppData', 'Local', 'Programs', 'claude', 'claude.exe'),
  'C:\\Program Files\\Claude\\claude.exe',
];

/**
 * Check if a file exists and is executable
 */
function isExecutable(path: string): boolean {
  try {
    if (!existsSync(path)) {
      return false;
    }

    // On Windows, just check if file exists (no execute bit)
    if (process.platform === 'win32') {
      return true;
    }

    // On Unix, check if file is executable
    accessSync(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Try to find Claude CLI in system PATH
 */
function findInPath(): string | null {
  try {
    const whichCommand = process.platform === 'win32' ? 'where' : 'which';
    const result = execSync(`${whichCommand} claude`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    }).trim();

    // Return first match (in case multiple are found)
    const paths = result.split('\n').filter(p => p.trim());
    if (paths.length > 0 && isExecutable(paths[0])) {
      return paths[0];
    }
  } catch {
    // Command not found in PATH
  }

  return null;
}

/**
 * Auto-detect the Claude CLI binary path
 *
 * Detection order:
 * 1. CLAUDE_CLI_PATH environment variable
 * 2. System PATH (using which/where)
 * 3. Common installation locations
 *
 * @returns The detected CLI path, or null if not found
 */
export function detectClaudeCLI(): string | null {
  // 1. Check environment variable override first
  const envPath = process.env.CLAUDE_CLI_PATH;
  if (envPath) {
    if (isExecutable(envPath)) {
      return envPath;
    } else {
      console.warn(`CLAUDE_CLI_PATH is set but path does not exist or is not executable: ${envPath}`);
      return null;
    }
  }

  // 2. Try to find in PATH
  const pathResult = findInPath();
  if (pathResult) {
    return pathResult;
  }

  // 3. Check common installation locations
  for (const location of CLAUDE_CLI_LOCATIONS) {
    if (isExecutable(location)) {
      return location;
    }
  }

  return null;
}

/**
 * Validate that a CLI path exists and is executable
 *
 * @param cliPath - The path to validate
 * @returns True if the path is valid and executable
 */
export function validateClaudeCLIPath(cliPath: string): boolean {
  return isExecutable(cliPath);
}
