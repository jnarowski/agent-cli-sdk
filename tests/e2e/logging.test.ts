import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { readFile, rm, mkdir } from 'fs/promises';
import path from 'path';
import {
  createClaudeAdapter,
  setLoggingConfig,
  getLoggingConfig,
  type LoggingConfig,
} from '../../src/index.js';
import { ClaudeAdapter } from '../../src/adapters/claude/index.js';

/**
 * E2E Logging Tests
 *
 * These tests verify the complete logging functionality with real CLI execution.
 * They are skipped by default and run with: RUN_E2E_TESTS=true npm test
 *
 * Prerequisites:
 * - Claude CLI installed and authenticated (claude setup-token)
 */

const shouldRunE2E = process.env.RUN_E2E_TESTS === 'true';
const describeE2E = shouldRunE2E ? describe : describe.skip;

describeE2E('E2E Logging Tests', () => {
  let claudeAdapter: ClaudeAdapter;
  const testDir = path.resolve(process.cwd(), 'test-logs-e2e');
  const centralLogPath = path.join(testDir, 'executions.jsonl');

  beforeAll(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });

    // Create adapter
    const claudeConfig = process.env.CLAUDE_CLI_PATH && !process.env.CLAUDE_CLI_PATH.includes('/mock/')
      ? { cliPath: process.env.CLAUDE_CLI_PATH }
      : {};

    try {
      claudeAdapter = createClaudeAdapter(claudeConfig);
    } catch (error) {
      console.error('Failed to create Claude adapter:', error);
      throw error;
    }

    // Configure logging
    const loggingConfig: LoggingConfig = {
      centralLogPath,
    };
    setLoggingConfig(loggingConfig);
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }

    // Reset logging config
    setLoggingConfig({});
  });

  describe('Per-execution logging', () => {
    it('should write input.json, output.json, and stream.jsonl', async () => {
      const logPath = path.join(testDir, 'execution-1');

      const response = await claudeAdapter.execute(
        'Say "Hello from logging test" and nothing else',
        {
          logPath,
          timeout: 60000,
        }
      );

      expect(response.status).toBe('success');

      // Verify input.json exists and contains prompt
      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');
      const inputData = JSON.parse(inputContent);
      expect(inputData.prompt).toContain('Hello from logging test');
      expect(inputData.options.logPath).toBe(logPath);

      // Verify output.json exists and contains response data
      const outputContent = await readFile(path.join(logPath, 'output.json'), 'utf-8');
      const outputData = JSON.parse(outputContent);
      expect(outputData.status).toBe('success');
      expect(outputData.sessionId).toBeDefined();
      expect(outputData.duration).toBeGreaterThan(0);
      expect(outputData.output).toContain('Hello');

      // Verify stream.jsonl exists and contains events
      const streamContent = await readFile(path.join(logPath, 'stream.jsonl'), 'utf-8');
      const streamLines = streamContent.trim().split('\n');
      expect(streamLines.length).toBeGreaterThan(0);

      // Parse first event to verify structure
      const firstEvent = JSON.parse(streamLines[0]);
      expect(firstEvent.type).toBeDefined();
      expect(firstEvent.timestamp).toBeDefined();
    }, 90000);

    it('should support streaming mode with event logging', async () => {
      const logPath = path.join(testDir, 'execution-streaming');
      const streamEvents: any[] = [];

      const response = await claudeAdapter.execute(
        'Count from 1 to 3',
        {
          logPath,
          streaming: true,
          timeout: 60000,
          onStream: (event) => {
            streamEvents.push(event);
          },
        }
      );

      expect(response.status).toBe('success');
      expect(streamEvents.length).toBeGreaterThan(0);

      // Verify stream.jsonl matches onStream events
      const streamContent = await readFile(path.join(logPath, 'stream.jsonl'), 'utf-8');
      const loggedEvents = streamContent.trim().split('\n').map(line => JSON.parse(line));

      expect(loggedEvents.length).toBe(streamEvents.length);
      expect(loggedEvents[0].type).toBe(streamEvents[0].type);
    }, 90000);

    it('should log file operations correctly', async () => {
      const logPath = path.join(testDir, 'execution-file-ops');

      const response = await claudeAdapter.execute(
        'Create a file /tmp/test-logging-e2e.txt with content "Test content"',
        {
          logPath,
          timeout: 60000,
        }
      );

      expect(response.status).toBe('success');

      // Verify output.json contains file operation metadata
      const outputContent = await readFile(path.join(logPath, 'output.json'), 'utf-8');
      const outputData = JSON.parse(outputContent);

      expect(outputData.metadata).toBeDefined();
      expect(outputData.actions).toBeDefined();

      // Should have tracked the file modification
      const filesModified = outputData.metadata.filesModified || [];
      expect(filesModified.length).toBeGreaterThan(0);
      expect(filesModified.some((f: string) => f.includes('test-logging-e2e.txt'))).toBe(true);
    }, 90000);
  });

  describe('Central log', () => {
    it('should append execution to central JSONL log', async () => {
      const logPath = path.join(testDir, 'execution-central-1');

      await claudeAdapter.execute(
        'Say "Central log test" and nothing else',
        {
          logPath,
          timeout: 60000,
        }
      );

      // Read central log
      const centralContent = await readFile(centralLogPath, 'utf-8');
      const entries = centralContent.trim().split('\n').map(line => JSON.parse(line));

      // Should have at least one entry
      expect(entries.length).toBeGreaterThanOrEqual(1);

      // Find our entry
      const ourEntry = entries.find(e => e.prompt?.includes('Central log test'));
      expect(ourEntry).toBeDefined();
      expect(ourEntry.adapter).toBe('claude');
      expect(ourEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(ourEntry.sessionId).toBeDefined();
      expect(ourEntry.status).toBe('success');
      expect(ourEntry.duration).toBeGreaterThan(0);
      expect(ourEntry.exitCode).toBe(0);
    }, 90000);

    it('should log multiple executions sequentially', async () => {
      const logPath1 = path.join(testDir, 'execution-multi-1');
      const logPath2 = path.join(testDir, 'execution-multi-2');

      // Read initial count
      let initialCount = 0;
      try {
        const content = await readFile(centralLogPath, 'utf-8');
        initialCount = content.trim().split('\n').length;
      } catch {
        // File might not exist yet
      }

      // Execute two tasks
      await claudeAdapter.execute('Say "Task 1"', { logPath: logPath1, timeout: 60000 });
      await claudeAdapter.execute('Say "Task 2"', { logPath: logPath2, timeout: 60000 });

      // Read updated log
      const centralContent = await readFile(centralLogPath, 'utf-8');
      const entries = centralContent.trim().split('\n');

      // Should have 2 more entries
      expect(entries.length).toBe(initialCount + 2);

      const newEntries = entries.slice(-2).map(line => JSON.parse(line));
      expect(newEntries[0].prompt).toContain('Task 1');
      expect(newEntries[1].prompt).toContain('Task 2');
    }, 180000);
  });

  describe('Workflow pattern logging', () => {
    it('should extract workflowId from logPath pattern', async () => {
      const workflowId = `test-workflow-${Date.now()}`;
      const logPath = path.join(testDir, `workflow-${workflowId}`, 'agent-1');

      await claudeAdapter.execute(
        'Say "Workflow test"',
        {
          logPath,
          timeout: 60000,
        }
      );

      // Read central log and find our entry
      const centralContent = await readFile(centralLogPath, 'utf-8');
      const entries = centralContent.trim().split('\n').map(line => JSON.parse(line));
      const ourEntry = entries.find(e => e.prompt?.includes('Workflow test'));

      expect(ourEntry).toBeDefined();
      expect(ourEntry.workflowId).toBe(workflowId);
    }, 90000);

    it('should log multi-agent workflow with consistent workflowId', async () => {
      const workflowId = `multi-agent-${Date.now()}`;

      const agent1Path = path.join(testDir, `workflow-${workflowId}`, 'agent-1-research');
      const agent2Path = path.join(testDir, `workflow-${workflowId}`, 'agent-2-analysis');

      // Execute two agents in sequence
      const response1 = await claudeAdapter.execute(
        'List files in current directory',
        {
          logPath: agent1Path,
          timeout: 60000,
        }
      );

      const response2 = await claudeAdapter.execute(
        'Count files in current directory',
        {
          logPath: agent2Path,
          timeout: 60000,
        }
      );

      expect(response1.status).toBe('success');
      expect(response2.status).toBe('success');

      // Verify both agents logged to their respective directories
      const input1 = await readFile(path.join(agent1Path, 'input.json'), 'utf-8');
      const input2 = await readFile(path.join(agent2Path, 'input.json'), 'utf-8');
      expect(JSON.parse(input1).prompt).toContain('List files');
      expect(JSON.parse(input2).prompt).toContain('Count files');

      // Verify central log has both entries with same workflowId
      const centralContent = await readFile(centralLogPath, 'utf-8');
      const entries = centralContent.trim().split('\n').map(line => JSON.parse(line));

      const agent1Entry = entries.find(e => e.options?.logPath?.includes('agent-1-research'));
      const agent2Entry = entries.find(e => e.options?.logPath?.includes('agent-2-analysis'));

      expect(agent1Entry).toBeDefined();
      expect(agent2Entry).toBeDefined();
      expect(agent1Entry.workflowId).toBe(workflowId);
      expect(agent2Entry.workflowId).toBe(workflowId);
    }, 180000);
  });

  describe('Logging configuration', () => {
    it('should retrieve configured logging settings', () => {
      const config = getLoggingConfig();

      expect(config).toBeDefined();
      expect(config?.centralLogPath).toBe(centralLogPath);
    });

    it('should work without central logging when disabled', async () => {
      // Temporarily disable central logging
      const originalConfig = getLoggingConfig();
      setLoggingConfig({});

      const logPath = path.join(testDir, 'execution-no-central');

      const response = await claudeAdapter.execute(
        'Say "No central logging"',
        {
          logPath,
          timeout: 60000,
        }
      );

      expect(response.status).toBe('success');

      // Per-execution logs should still exist
      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');
      expect(inputContent).toContain('No central logging');

      // Restore original config
      if (originalConfig) {
        setLoggingConfig(originalConfig);
      }
    }, 90000);
  });

  describe('Error handling', () => {
    it('should log failed executions with error status', async () => {
      const logPath = path.join(testDir, 'execution-timeout');

      try {
        await claudeAdapter.execute(
          'Think deeply about this for a very long time',
          {
            logPath,
            timeout: 1000, // Very short timeout to force failure
          }
        );
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Expected to timeout
        expect(error).toBeDefined();
      }

      // Even failed executions should log input
      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');
      const inputData = JSON.parse(inputContent);
      expect(inputData.options.timeout).toBe(1000);
    }, 20000);
  });
});
