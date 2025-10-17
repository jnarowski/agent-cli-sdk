/**
 * Example: Multi-agent workflow with comprehensive logging
 *
 * This example demonstrates:
 * 1. Setting up global central logging
 * 2. Per-execution logging with workflow pattern (logs/workflow-{id}/agent-{n}/)
 * 3. Multiple agents working together with full traceability
 * 4. Reading logs back for analysis
 */

import path from 'path';
import { readFile } from 'fs/promises';
import {
  ClaudeAdapter,
  setLoggingConfig,
  type LoggingConfig,
  type AdapterResponse,
} from '../dist/index';

async function main() {
  // Setup: Configure central logging
  const centralLogPath = path.resolve(process.cwd(), 'logs/executions.jsonl');
  const loggingConfig: LoggingConfig = {
    centralLogPath,
  };
  setLoggingConfig(loggingConfig);

  console.log('📝 Logging configured:');
  console.log(`  Central log: ${centralLogPath}`);
  console.log();

  // Create a unique workflow ID for this example
  const workflowId = `workflow-${Date.now()}`;
  console.log(`🔄 Starting workflow: ${workflowId}`);
  console.log();

  try {
    // Create Claude adapter
    const claude = new ClaudeAdapter();

    // Agent 1: Research task
    console.log('🤖 Agent 1: Researching project structure...');
    const agent1LogPath = path.resolve(
      process.cwd(),
      `logs/${workflowId}/agent-1-research`
    );
    const research: AdapterResponse = await claude.execute(
      'List all TypeScript files in the src/ directory',
      {
        logPath: agent1LogPath,
        dangerouslySkipPermissions: true,
      }
    );
    console.log(`✅ Agent 1 complete (session: ${research.sessionId})`);
    console.log(`   Logs: ${agent1LogPath}/`);
    console.log();

    // Agent 2: Analysis task
    console.log('🤖 Agent 2: Analyzing codebase metrics...');
    const agent2LogPath = path.resolve(
      process.cwd(),
      `logs/${workflowId}/agent-2-analysis`
    );
    const analysis: AdapterResponse = await claude.execute(
      'Count the total number of lines in all TypeScript files',
      {
        logPath: agent2LogPath,
        dangerouslySkipPermissions: true,
      }
    );
    console.log(`✅ Agent 2 complete (session: ${analysis.sessionId})`);
    console.log(`   Logs: ${agent2LogPath}/`);
    console.log();

    // Agent 3: Summary task
    console.log('🤖 Agent 3: Generating summary...');
    const agent3LogPath = path.resolve(
      process.cwd(),
      `logs/${workflowId}/agent-3-summary`
    );
    const summary: AdapterResponse = await claude.execute(
      'Create a brief summary of the project structure based on the TypeScript files you found',
      {
        logPath: agent3LogPath,
        sessionId: analysis.sessionId, // Resume from agent 2's session
        dangerouslySkipPermissions: true,
      }
    );
    console.log(`✅ Agent 3 complete (session: ${summary.sessionId})`);
    console.log(`   Logs: ${agent3LogPath}/`);
    console.log();

    // Demonstrate: Read logs back for analysis
    console.log('📊 Reading logs for analysis...');
    console.log();

    // Read agent 1's input
    const agent1Input = JSON.parse(
      await readFile(path.join(agent1LogPath, 'input.json'), 'utf-8')
    );
    console.log('📥 Agent 1 Input:');
    console.log(`   Prompt: ${agent1Input.prompt}`);
    console.log();

    // Read agent 1's output
    const agent1Output = JSON.parse(
      await readFile(path.join(agent1LogPath, 'output.json'), 'utf-8')
    );
    console.log('📤 Agent 1 Output:');
    console.log(`   Status: ${agent1Output.status}`);
    console.log(`   Duration: ${agent1Output.duration}ms`);
    console.log(`   Tools used: ${agent1Output.metadata.toolsUsed?.join(', ') || 'none'}`);
    console.log();

    // Read agent 1's stream events
    const agent1Stream = await readFile(
      path.join(agent1LogPath, 'stream.jsonl'),
      'utf-8'
    );
    const streamEvents = agent1Stream
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    console.log('📡 Agent 1 Stream Events:');
    console.log(`   Total events: ${streamEvents.length}`);
    console.log(
      `   Event types: ${[...new Set(streamEvents.map((e) => e.type))].join(', ')}`
    );
    console.log();

    // Read central log (last 3 entries)
    const centralLog = await readFile(centralLogPath, 'utf-8');
    const allEntries = centralLog
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line));
    const recentEntries = allEntries.slice(-3);

    console.log('📋 Central Log (last 3 entries):');
    for (const entry of recentEntries) {
      console.log(`   - ${entry.timestamp}`);
      console.log(`     Adapter: ${entry.adapter}`);
      console.log(`     Workflow: ${entry.workflowId || 'none'}`);
      console.log(`     Status: ${entry.status}`);
      console.log(`     Duration: ${entry.duration}ms`);
      console.log();
    }

    console.log('✨ Workflow complete!');
    console.log(`📁 All logs saved to: logs/${workflowId}/`);
    console.log(`📄 Central log: ${centralLogPath}`);
  } catch (error) {
    console.error('❌ Workflow failed:', error);
    process.exit(1);
  }
}

main();
