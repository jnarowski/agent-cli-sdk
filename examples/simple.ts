/**
 * Simple single-agent example
 * Demonstrates basic Claude adapter usage
 */

import { createClaudeAdapter } from '../src/index.js';

async function simpleExample() {
  try {
    console.log('Creating Claude adapter...');
    const claude = createClaudeAdapter();

    console.log('\nExecuting prompt...');
    const response = await claude.execute(
      'Create a TypeScript function that validates email addresses using regex',
      {
        model: 'sonnet',
        permissionMode: 'acceptEdits',
      }
    );

    console.log('\n=== Response ===');
    console.log(`Status: ${response.status}`);
    console.log(`Duration: ${response.duration}ms`);
    console.log(`Session ID: ${response.sessionId}`);
    console.log(`\nOutput:\n${response.output}`);

    if (response.metadata.filesModified) {
      console.log(`\nFiles modified: ${response.metadata.filesModified.join(', ')}`);
    }

    if (response.actions && response.actions.length > 0) {
      console.log(`\nActions performed: ${response.actions.length}`);
      response.actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.type}${action.target ? `: ${action.target}` : ''}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
simpleExample();
