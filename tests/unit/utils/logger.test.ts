import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFile, rm, mkdir } from 'fs/promises';
import path from 'path';
import { writeExecutionLogs } from '../../../src/utils/logger';
import type { ExecutionResponse } from '../../../src/types/config';

describe('Logger Utilities', () => {
  const testDir = path.resolve(process.cwd(), 'test-logs');

  beforeEach(async () => {
    // Create test directory
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('writeExecutionLogs', () => {
    it('should write all three log files', async () => {
      const logPath = path.join(testDir, 'execution-1');

      const input = {
        prompt: 'Test prompt',
        options: { timeout: 30000 },
      };

      const output: ExecutionResponse = {
        status: 'success',
        output: 'Test output',
        exitCode: 0,
        sessionId: 'session-123',
        duration: 1000,
        metadata: { filesModified: ['test.ts'] },
      };

      const events = [
        { type: 'system' as const, timestamp: Date.now(), data: {} },
        { type: 'message.chunk' as const, timestamp: Date.now(), data: { content: 'Hello' } },
      ];

      await writeExecutionLogs(logPath, input, output, events);

      // Check input.json
      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');
      const parsedInput = JSON.parse(inputContent);
      expect(parsedInput).toEqual(input);

      // Check output.json
      const outputContent = await readFile(path.join(logPath, 'output.json'), 'utf-8');
      const parsedOutput = JSON.parse(outputContent);
      expect(parsedOutput).toEqual(output);

      // Check stream.jsonl
      const streamContent = await readFile(path.join(logPath, 'stream.jsonl'), 'utf-8');
      const streamLines = streamContent.trim().split('\n');
      expect(streamLines).toHaveLength(2);
      expect(JSON.parse(streamLines[0])).toEqual(events[0]);
      expect(JSON.parse(streamLines[1])).toEqual(events[1]);
    });

    it('should handle empty events array', async () => {
      const logPath = path.join(testDir, 'execution-2');

      const input = { prompt: 'Test' };
      const output: ExecutionResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
      };
      const events: any[] = [];

      await writeExecutionLogs(logPath, input, output, events);

      const streamContent = await readFile(path.join(logPath, 'stream.jsonl'), 'utf-8');
      expect(streamContent).toBe('');
    });

    it('should create log directory if it does not exist', async () => {
      const logPath = path.join(testDir, 'nested', 'execution');

      const input = { prompt: 'Test' };
      const output: ExecutionResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
      };

      await writeExecutionLogs(logPath, input, output, []);

      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');
      expect(inputContent).toContain('Test');
    });

    it('should write valid JSON with proper formatting', async () => {
      const logPath = path.join(testDir, 'execution-formatted');

      const input = { prompt: 'Test', nested: { key: 'value' } };
      const output: ExecutionResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
      };

      await writeExecutionLogs(logPath, input, output, []);

      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');

      // Should be pretty-printed with 2-space indentation
      expect(inputContent).toContain('  "prompt"');
      expect(inputContent).toContain('  "nested"');
    });
  });
});
