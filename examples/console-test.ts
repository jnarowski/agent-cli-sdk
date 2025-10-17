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

import { createClaudeAdapter, createCodexAdapter } from '../src/index';
import type { ClaudeConfig, CodexConfig } from '../src/types/index';

// ============================================================================
// CONFIGURATION - Modify these to test different scenarios
// ============================================================================

const CLAUDE_CONFIG: Partial<ClaudeConfig> = {
  // apiKey: process.env.ANTHROPIC_API_KEY, // Optional
  cliPath: '/Users/jnarowski/.claude/local/claude', // Explicit path since 'claude' is an alias
  verbose: true, // Enable verbose logging to see CLI commands
};

const CODEX_CONFIG: Partial<CodexConfig> = {
  // apiKey: process.env.CODEX_API_KEY, // Optional
  // cliPath: '/custom/path/to/codex', // Optional
};

const TEST_PROMPT_SIMPLE = 'What is 2 + 2? Please explain briefly.';
const TEST_PROMPT_WITH_TOOLS = 'Read the package.json file and tell me the package name and version.';

// Execution options
const ENABLE_STREAMING = true; // Enable streaming to test real-time output
const TIMEOUT_MS = 60000; // Increase timeout
const VERBOSE = true; // Enable verbose mode to see CLI commands and arguments

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

    // Execute simple prompt
    console.log(`Prompt: "${TEST_PROMPT_SIMPLE}"\n`);

    const startTime = Date.now();

    const execOptions: any = {
      timeout: TIMEOUT_MS,
    };

    if (ENABLE_STREAMING) {
      execOptions.streaming = true;
      execOptions.onStream = (event: any) => {
        // Handle different event types
        if (event.type === 'system' && event.subtype === 'init') {
          console.log(`\n📡 Session initialized: ${event.session_id}`);
          console.log(`   Model: ${event.model}`);
          console.log(`   Available tools: ${event.tools.length}`);
        } else if (event.type === 'assistant') {
          console.log('\n💬 Assistant response received');
          if (event.message?.content) {
            const textContent = event.message.content
              .filter((c: any) => c.type === 'text')
              .map((c: any) => c.text)
              .join('\n');
            if (textContent) {
              console.log(`   ${textContent.slice(0, 100)}${textContent.length > 100 ? '...' : ''}`);
            }
          }
        } else if (event.type === 'result') {
          console.log(`\n✅ Result (${event.subtype})`);
          console.log(`   Duration: ${event.duration_ms}ms`);
          console.log(`   API Duration: ${event.duration_api_ms}ms`);
          console.log(`   Cost: $${event.total_cost_usd?.toFixed(6) || '0'}`);
          console.log(`   Tokens: ${event.usage?.input_tokens || 0} in, ${event.usage?.output_tokens || 0} out`);
        }
      };
    }

    const response = await claude.execute(TEST_PROMPT_SIMPLE, execOptions);

    const duration = Date.now() - startTime;

    console.log('\n\n' + '-'.repeat(80));
    console.log('RESPONSE DETAILS:');
    console.log('-'.repeat(80));
    console.log('Status:', response.status);
    console.log('Session ID:', response.sessionId);
    console.log('Duration:', duration + 'ms');
    console.log('Actions:', response.actions?.length || 0);

    console.log('\nOutput:');
    console.log('-'.repeat(80));
    console.log(response.output || '(no output)');
    console.log('-'.repeat(80));

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
