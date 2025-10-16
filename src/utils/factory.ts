import { ClaudeAdapter } from '../adapters/claude/index.js';
import { CodexAdapter } from '../adapters/codex/index.js';
import type { ClaudeConfig } from '../types/claude.js';
import type { CodexConfig } from '../types/codex.js';
import { CLINotFoundError } from '../core/errors.js';
import { findCLI } from './cli-detector.js';

/**
 * Create a Claude Code adapter instance
 * Auto-detects CLI location or uses CLAUDE_CLI_PATH environment variable
 * @param config Optional configuration
 * @returns Configured Claude adapter
 */
export function createClaudeAdapter(config: ClaudeConfig = {}): ClaudeAdapter {
  // Find Claude CLI binary
  const cliPath = config.cliPath || findCLI('claude');

  if (!cliPath) {
    throw new CLINotFoundError(
      'claude',
      'Claude CLI not found in PATH. Install from: https://claude.ai/download\n' +
        'Or set CLAUDE_CLI_PATH=/path/to/claude'
    );
  }

  // Warn if multiple auth methods are detected
  const hasApiKey = !!config.apiKey || !!process.env.ANTHROPIC_API_KEY;
  const hasOAuthToken = !!config.oauthToken || !!process.env.CLAUDE_CODE_OAUTH_TOKEN;

  if (hasApiKey && hasOAuthToken) {
    console.warn(
      'Warning: Both API key and OAuth token are available. OAuth token will be prioritized.'
    );
  }

  return new ClaudeAdapter(cliPath, config);
}

/**
 * Create a Codex adapter instance
 * Auto-detects CLI location or uses CODEX_CLI_PATH environment variable
 * @param config Optional configuration
 * @returns Configured Codex adapter
 */
export function createCodexAdapter(config: CodexConfig = {}): CodexAdapter {
  // Find Codex CLI binary
  const cliPath = config.cliPath || findCLI('codex');

  if (!cliPath) {
    throw new CLINotFoundError(
      'codex',
      'Codex CLI not found in PATH. Install instructions: https://codex.openai.com\n' +
        'Or set CODEX_CLI_PATH=/path/to/codex\n' +
        'After installation, run: codex login'
    );
  }

  return new CodexAdapter(cliPath, config);
}
