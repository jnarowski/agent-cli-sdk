import { detectClaudeCLI } from '../adapters/claude/cli-detector.js';
import { detectCodexCLI } from '../adapters/codex/cli-detector.js';

/**
 * Find a CLI binary in the system PATH or use environment variable override
 *
 * This is a convenience wrapper that delegates to the adapter-specific detectors.
 * For more control, use the adapter-specific detection functions directly.
 *
 * @param command The CLI command name ('claude' or 'codex')
 * @returns Full path to the CLI binary or null if not found
 */
export function findCLI(command: 'claude' | 'codex'): string | null {
  if (command === 'claude') {
    return detectClaudeCLI();
  } else {
    return detectCodexCLI();
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
