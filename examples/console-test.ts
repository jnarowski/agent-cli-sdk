#!/usr/bin/env -S sh -c 'command -v bun >/dev/null 2>&1 && exec bun "$0" "$@" || exec npx tsx "$0" "$@"'
/**
 * Console test script for Agent CLI SDK
 *
 * Usage:
 *   bun examples/console-test.ts          # Uses bun if available
 *   npx tsx examples/console-test.ts      # Uses tsx/Node
 *   ./examples/console-test.ts            # Auto-detects bun or tsx
 *
 *   # Test specific adapter:
 *   bun examples/console-test.ts claude
 *   bun examples/console-test.ts codex
 *
 * Modify the configurations below to test different scenarios
 */

import { createClaudeAdapter, createCodexAdapter } from '../src/index.js';
import type { ClaudeConfig, CodexConfig } from '../src/types/index.js';

// ============================================================================
// CONFIGURATION - Modify these to test different scenarios
// ============================================================================

const CLAUDE_CONFIG: Partial<ClaudeConfig> = {
  // apiKey: process.env.ANTHROPIC_API_KEY, // Optional
  // cliPath: '/custom/path/to/claude', // Optional
};

const CODEX_CONFIG: Partial<CodexConfig> = {
  // apiKey: process.env.CODEX_API_KEY, // Optional
  // cliPath: '/custom/path/to/codex', // Optional
};

const TEST_PROMPT = 'What is 2 + 2? Please explain briefly.';

// Execution options
const ENABLE_STREAMING = true;
const TIMEOUT_MS = 30000;

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function testClaude() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING CLAUDE ADAPTER');
  console.log('='.repeat(80) + '\n');

  try {
    const claude = createClaudeAdapter(CLAUDE_CONFIG);

    // Show capabilities
    console.log('Capabilities:', claude.getCapabilities());
    console.log('\n' + '-'.repeat(80) + '\n');

    // Execute prompt
    console.log(`Prompt: "${TEST_PROMPT}"\n`);

    const startTime = Date.now();

    const response = await claude.execute(TEST_PROMPT, {
      streaming: ENABLE_STREAMING,
      timeout: TIMEOUT_MS,
      onStream: (event) => {
        if (event.type === 'message.chunk') {
          process.stdout.write(event.data.content || '');
        } else if (event.type === 'tool.started') {
          console.log(`\n🔧 Tool: ${event.data.toolName}`);
        } else if (event.type === 'tool.completed') {
          console.log(`✅ Tool completed: ${event.data.toolName}`);
        } else if (event.type === 'error') {
          console.error(`❌ Error: ${event.data.message}`);
        }
      },
    });

    const duration = Date.now() - startTime;

    console.log('\n\n' + '-'.repeat(80));
    console.log('RESPONSE DETAILS:');
    console.log('-'.repeat(80));
    console.log('Status:', response.status);
    console.log('Session ID:', response.sessionId);
    console.log('Duration:', duration + 'ms');
    console.log('Actions:', response.actions?.length || 0);

    if (response.actions && response.actions.length > 0) {
      console.log('\nActions taken:');
      response.actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.type} - ${action.description}`);
      });
    }

    if (response.error) {
      console.error('\nError:', response.error);
    }

    return response;

  } catch (error) {
    console.error('\n❌ Claude test failed:', error);
    throw error;
  }
}

async function testCodex() {
  console.log('\n' + '='.repeat(80));
  console.log('TESTING CODEX ADAPTER');
  console.log('='.repeat(80) + '\n');

  try {
    const codex = createCodexAdapter(CODEX_CONFIG);

    // Show capabilities
    console.log('Capabilities:', codex.getCapabilities());
    console.log('\n' + '-'.repeat(80) + '\n');

    // Execute prompt
    console.log(`Prompt: "${TEST_PROMPT}"\n`);

    const startTime = Date.now();

    const response = await codex.execute(TEST_PROMPT, {
      streaming: ENABLE_STREAMING,
      timeout: TIMEOUT_MS,
      fullAuto: true,
      onStream: (event) => {
        if (event.type === 'message.chunk') {
          process.stdout.write(event.data.content || '');
        } else if (event.type === 'tool.started') {
          console.log(`\n🔧 Tool: ${event.data.toolName}`);
        } else if (event.type === 'tool.completed') {
          console.log(`✅ Tool completed: ${event.data.toolName}`);
        } else if (event.type === 'error') {
          console.error(`❌ Error: ${event.data.message}`);
        }
      },
    });

    const duration = Date.now() - startTime;

    console.log('\n\n' + '-'.repeat(80));
    console.log('RESPONSE DETAILS:');
    console.log('-'.repeat(80));
    console.log('Status:', response.status);
    console.log('Session ID:', response.sessionId);
    console.log('Duration:', duration + 'ms');
    console.log('Actions:', response.actions?.length || 0);

    if (response.actions && response.actions.length > 0) {
      console.log('\nActions taken:');
      response.actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.type} - ${action.description}`);
      });
    }

    if (response.error) {
      console.error('\nError:', response.error);
    }

    return response;

  } catch (error) {
    console.error('\n❌ Codex test failed:', error);
    throw error;
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('Agent CLI SDK - Console Test');
  console.log('Node version:', process.version);
  console.log('Working directory:', process.cwd());
  console.log('');

  // Determine which adapter to test based on CLI args
  const args = process.argv.slice(2);
  const adapter = args[0]?.toLowerCase();

  if (!adapter || adapter === 'claude') {
    await testClaude();
  }

  if (!adapter || adapter === 'codex') {
    await testCodex();
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed');
  console.log('='.repeat(80) + '\n');
}

// Run
main().catch((error) => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
