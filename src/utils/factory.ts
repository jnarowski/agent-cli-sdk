import { ClaudeAdapter } from '../adapters/claude/index.js';
import { CodexAdapter } from '../adapters/codex/index.js';
import type { ClaudeConfig } from '../types/claude.js';
import type { CodexConfig } from '../types/codex.js';

/**
 * Create a Claude Code adapter instance
 * Auto-detects CLI location or uses CLAUDE_CLI_PATH environment variable
 * @param config Optional configuration
 * @returns Configured Claude adapter
 */
export function createClaudeAdapter(config: ClaudeConfig = {}): ClaudeAdapter {
  // Warn if multiple auth methods are detected
  const hasApiKey = !!config.apiKey || !!process.env.ANTHROPIC_API_KEY;
  const hasOAuthToken = !!config.oauthToken || !!process.env.CLAUDE_CODE_OAUTH_TOKEN;

  if (hasApiKey && hasOAuthToken) {
    console.warn(
      'Warning: Both API key and OAuth token are available. OAuth token will be prioritized.'
    );
  }

  // Let the adapter handle CLI detection and error messaging
  return new ClaudeAdapter(config.cliPath, config);
}

/**
 * Create a Codex adapter instance
 * Auto-detects CLI location or uses CODEX_CLI_PATH environment variable
 * @param config Optional configuration
 * @returns Configured Codex adapter
 */
export function createCodexAdapter(config: CodexConfig = {}): CodexAdapter {
  // Let the adapter handle CLI detection and error messaging
  return new CodexAdapter(config.cliPath, config);
}
