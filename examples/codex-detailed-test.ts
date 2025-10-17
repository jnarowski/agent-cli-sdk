#!/usr/bin/env tsx
/**
 * Test script to verify that we're capturing all detailed information from Codex
 */
import { createCodexAdapter } from '../src/index';
import { renderConsoleBox } from '../src/utils/renderConsoleBox';

async function main() {
  console.log('Testing Codex detailed response parsing...\n');

  const codex = createCodexAdapter();

  try {
    const response = await codex.execute('List the files in the current directory', {
      fullAuto: true,
    });

    renderConsoleBox('Codex Detailed Response', JSON.stringify({
      output: response.output,
      sessionId: response.sessionId,
      status: response.status,
      exitCode: response.exitCode,
      duration: response.duration,
      actions: response.actions,
      metadata: response.metadata,
      usage: response.usage,
      modelUsage: response.modelUsage,
      totalCostUSD: response.totalCostUSD,
      raw: {
        stdout: response.raw?.stdout?.substring(0, 200) + '...',
        events: response.raw?.events?.length,
      },
    }, null, 2));

    // Print specific details
    console.log('\n📊 Token Usage:');
    if (response.usage) {
      console.log(`  Input tokens: ${response.usage.inputTokens}`);
      console.log(`  Output tokens: ${response.usage.outputTokens}`);
      console.log(`  Cached input tokens: ${response.usage.cacheReadInputTokens}`);
      console.log(`  Total tokens: ${response.usage.totalTokens}`);
    } else {
      console.log('  No usage data available');
    }

    console.log('\n🔧 Actions Performed:');
    if (response.actions && response.actions.length > 0) {
      response.actions.forEach((action, i) => {
        console.log(`  ${i + 1}. ${action.type}: ${action.target || '(no target)'}`);
      });
    } else {
      console.log('  No actions logged');
    }

    console.log('\n📝 Metadata:');
    console.log(`  Model: ${response.metadata.model || 'unknown'}`);
    console.log(`  Files modified: ${response.metadata.filesModified?.length || 0}`);
    console.log(`  Tools used: ${response.metadata.toolsUsed?.length || 0}`);

    console.log('\n🎯 Raw Events:');
    console.log(`  Total events: ${response.raw?.events?.length || 0}`);
    if (response.raw?.events) {
      const eventTypes = response.raw.events.reduce((acc, e) => {
        acc[e.type] = (acc[e.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log('  Event type breakdown:');
      Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`    - ${type}: ${count}`);
      });

      // Print first few events to see the data structure
      console.log('\n📋 Sample Events (first 3):');
      response.raw.events.slice(0, 3).forEach((event, i) => {
        console.log(`\n  Event ${i + 1}:`);
        console.log(JSON.stringify(event, null, 2).split('\n').map(line => `    ${line}`).join('\n'));
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
