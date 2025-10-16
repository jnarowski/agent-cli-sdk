#!/usr/bin/env -S npx tsx
/**
 * File operations test - verify tool tracking and file modification tracking
 */

import { createClaudeAdapter } from '../src/index.js';
import type { ClaudeConfig } from '../src/types/index.js';

const CLAUDE_CONFIG: Partial<ClaudeConfig> = {
  cliPath: '/Users/jnarowski/.claude/local/claude',
  verbose: false,
};

async function testFileOperations() {
  console.log('Testing File Operations Tracking\n');

  const claude = createClaudeAdapter(CLAUDE_CONFIG);

  const prompt = 'Create a file /tmp/test-agent-sdk.txt with the text "Hello from Agent SDK"';

  console.log(`Prompt: "${prompt}"\n`);

  const response = await claude.execute(prompt, {
    timeout: 60000,
  });

  console.log('='.repeat(80));
  console.log('RESULTS:');
  console.log('='.repeat(80));
  console.log('Status:', response.status);
  console.log('Session ID:', response.sessionId);
  console.log('Duration:', response.duration + 'ms');

  console.log('\nMetadata:');
  console.log('  Model:', response.metadata?.model);
  console.log('  Tools used:', response.metadata?.toolsUsed || []);
  console.log('  Files modified:', response.metadata?.filesModified || []);

  console.log('\nActions:');
  if (response.actions && response.actions.length > 0) {
    response.actions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.type.toUpperCase()}`);
      console.log(`     Target: ${action.target || 'N/A'}`);
      console.log(`     Tool: ${action.metadata?.toolName || 'N/A'}`);
    });
  } else {
    console.log('  No actions captured');
  }

  console.log('\nOutput:');
  console.log('-'.repeat(80));
  console.log(response.output);
  console.log('-'.repeat(80));

  // Verify expectations
  const hasWriteAction = response.actions?.some(a => a.type === 'write');
  const filesModified = response.metadata?.filesModified || [];
  const hasTargetFile = filesModified.includes('/tmp/test-agent-sdk.txt');

  console.log('\n✅ Verification:');
  console.log(`  Write action captured: ${hasWriteAction}`);
  console.log(`  Files modified tracked: ${filesModified.length > 0}`);
  console.log(`  Target file tracked: ${hasTargetFile}`);

  if (hasWriteAction && hasTargetFile) {
    console.log('\n🎉 File operation tracking is working correctly!');
  } else {
    console.log('\n⚠️  File operation tracking may need adjustment');
  }
}

testFileOperations().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
