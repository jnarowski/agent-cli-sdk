/**
 * Multi-agent workflow example
 * Demonstrates coordinating Claude and Codex
 */

import { createClaudeAdapter, createCodexAdapter } from '../src/index.js';

async function multiAgentWorkflow() {
  try {
    console.log('Initializing adapters...');
    const claude = createClaudeAdapter();
    const codex = createCodexAdapter();

    console.log('\n=== Step 1: Generate code with Claude ===');
    const generated = await claude.execute(
      'Create a function to validate email addresses with comprehensive regex',
      {
        streaming: true,
        permissionMode: 'acceptEdits',
        onStream: (event) => {
          if (event.type === 'tool.started') {
            console.log(`  🔧 Using ${event.data.toolName}...`);
          }
          if (event.type === 'message.chunk' && event.data.content) {
            // Print streaming content in real-time
            process.stdout.write(event.data.content);
          }
        },
      }
    );

    console.log(`\n\n✓ Generated (Session: ${generated.sessionId})`);
    console.log(`  Duration: ${generated.duration}ms`);
    if (generated.metadata.filesModified) {
      console.log(`  Files: ${generated.metadata.filesModified.join(', ')}`);
    }

    console.log('\n=== Step 2: Review with Codex ===');
    const review = await codex.execute(
      'Review the email validation function for security vulnerabilities and edge cases. Provide specific improvement suggestions.',
      {
        fullAuto: true,
        workingDirectory: process.cwd(),
      }
    );

    console.log(`✓ Review complete (Duration: ${review.duration}ms)`);
    console.log(`\nReview feedback:\n${review.output}`);

    console.log('\n=== Step 3: Apply feedback with Claude ===');
    const fixed = await claude.execute(
      `Apply these review suggestions to improve the code:\n\n${review.output}`,
      {
        sessionId: generated.sessionId, // Resume previous session
        permissionMode: 'acceptEdits',
      }
    );

    console.log(`\n✓ Improvements applied (Session: ${fixed.sessionId})`);
    console.log(`  Duration: ${fixed.duration}ms`);
    console.log(`  Total actions across workflow: ${(generated.actions?.length || 0) + (fixed.actions?.length || 0)}`);

    console.log('\n=== Workflow Complete ===');
    console.log('Summary:');
    console.log(`  1. Claude generated initial implementation`);
    console.log(`  2. Codex reviewed for security and edge cases`);
    console.log(`  3. Claude applied improvements`);
    console.log(`\nTotal time: ${generated.duration + review.duration + fixed.duration}ms`);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the example
multiAgentWorkflow();
