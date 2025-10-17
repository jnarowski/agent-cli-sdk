import { ClaudeAdapter } from '../adapters/claude/index';
import { CodexAdapter } from '../adapters/codex/index';
import type { ClaudeConfig } from '../types/claude';
import type { CodexConfig } from '../types/codex';

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

  // Pass config directly to adapter
  return new ClaudeAdapter(config);
}

/**
 * Create a Codex adapter instance
 * Auto-detects CLI location or uses CODEX_CLI_PATH environment variable
 * @param config Optional configuration
 * @returns Configured Codex adapter
 */
export function createCodexAdapter(config: CodexConfig = {}): CodexAdapter {
  // Pass config directly to adapter
  return new CodexAdapter(config);
}
