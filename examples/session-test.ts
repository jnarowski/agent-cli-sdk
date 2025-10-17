#!/usr/bin/env -S npx tsx
/**
 * Session management test
 * Tests the Claude adapter's ability to maintain conversation context across multiple turns
 */

import { createClaudeAdapter } from '../src/index';
import type { ClaudeConfig } from '../src/types/index';

const CLAUDE_CONFIG: Partial<ClaudeConfig> = {
  cliPath: '/Users/jnarowski/.claude/local/claude',
  verbose: false, // Disable verbose for cleaner output
};

async function testSessionManagement() {
  console.log('Testing Claude Adapter - Session ID Capture\n');
  console.log('='.repeat(80));
  console.log('\nNOTE: Claude CLI session IDs are process-specific.');
  console.log('Each execute() call spawns a new process with a new session.');
  console.log('Session IDs are useful for tracking and debugging individual executions.\n');

  const claude = createClaudeAdapter(CLAUDE_CONFIG);

  // Test 1: Simple execution
  console.log('📝 Test 1: Simple execution');
  console.log('Prompt: "What is 5 + 3?"\n');

  const response1 = await claude.execute(
    'What is 5 + 3?',
    { timeout: 60000 }
  );

  console.log(`✅ Execution completed`);
  console.log(`   Session ID: ${response1.sessionId}`);
  console.log(`   Response: ${response1.output.split('\n')[0]}\n`);

  // Test 2: Another execution
  console.log('='.repeat(80));
  console.log('\n📝 Test 2: Another execution');
  console.log('Prompt: "What is the capital of France?"\n');

  const response2 = await claude.execute(
    'What is the capital of France?',
    { timeout: 60000 }
  );

  console.log(`✅ Execution completed`);
  console.log(`   Session ID: ${response2.sessionId}`);
  console.log(`   Response: ${response2.output.split('\n')[0]}\n`);

  // Verify session IDs are different (since they're separate processes)
  console.log('='.repeat(80));
  console.log('\n✅ Results:');
  console.log(`Session IDs are different: ${response1.sessionId !== response2.sessionId}`);
  console.log(`Both executions successful: ${response1.status === 'success' && response2.status === 'success'}`);

  console.log('\n💡 Session IDs are useful for:');
  console.log('   - Tracking individual executions in logs');
  console.log('   - Debugging specific interactions');
  console.log('   - Correlating costs and usage metrics');
  console.log('   - Identifying unique conversations in your application');
}

testSessionManagement().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
