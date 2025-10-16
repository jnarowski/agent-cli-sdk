#!/usr/bin/env -S npx tsx
/**
 * Streaming test with tool usage
 * Tests the Claude adapter's ability to capture tool calls in streaming mode
 */

import { createClaudeAdapter } from '../src/index.js';
import type { ClaudeConfig } from '../src/types/index.js';

const CLAUDE_CONFIG: Partial<ClaudeConfig> = {
  cliPath: '/Users/jnarowski/.claude/local/claude',
  verbose: true,
};

async function testStreamingWithTools() {
  console.log('Testing Claude Adapter - Streaming with Tool Usage\n');

  const claude = createClaudeAdapter(CLAUDE_CONFIG);

  const prompt = 'Read the package.json file and tell me the package name and version.';

  console.log(`Prompt: "${prompt}"\n`);

  const toolEvents: any[] = [];

  const response = await claude.execute(prompt, {
    streaming: true,
    timeout: 60000,
    onStream: (event: any) => {
      if (event.type === 'system' && event.subtype === 'init') {
        console.log(`📡 Session: ${event.session_id}`);
        console.log(`   Model: ${event.model}\n`);
      } else if (event.type === 'tool_use') {
        console.log(`🔧 Tool Use: ${event.name || event.toolName}`);
        toolEvents.push(event);
      } else if (event.type === 'tool_result') {
        console.log(`✅ Tool Result`);
      } else if (event.type === 'assistant') {
        const content = event.message?.content || [];
        for (const block of content) {
          if (block.type === 'text' && block.text) {
            console.log(`💬 Response: ${block.text.slice(0, 200)}`);
          } else if (block.type === 'tool_use') {
            console.log(`🔧 Tool: ${block.name} (${block.id})`);
            toolEvents.push(block);
          }
        }
      } else if (event.type === 'result') {
        console.log(`\n✅ Complete (${event.duration_ms}ms, $${event.total_cost_usd?.toFixed(6)})`);
      }
    },
  });

  console.log('\n' + '='.repeat(80));
  console.log('RESULTS:');
  console.log('='.repeat(80));
  console.log('Status:', response.status);
  console.log('Session ID:', response.sessionId);
  console.log('Actions:', response.actions?.length || 0);
  console.log('Tool events captured:', toolEvents.length);

  console.log('\nFinal Output:');
  console.log('-'.repeat(80));
  console.log(response.output);
  console.log('-'.repeat(80));

  if (toolEvents.length > 0) {
    console.log('\nTools Used:');
    toolEvents.forEach((tool, i) => {
      console.log(`  ${i + 1}. ${tool.name || tool.toolName}`);
    });
  }
}

testStreamingWithTools().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
