import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile, appendFile, readFile, rm } from 'fs/promises';
import path from 'path';
import {
  setLoggingConfig,
  getLoggingConfig,
  writeToCentralLog,
  writeExecutionLogs,
  buildExecutionLogEntry,
} from '../../../src/utils/logger.js';
import type {
  LoggingConfig,
  ExecutionLogEntry,
} from '../../../src/types/logging.js';
import type { AdapterResponse, ExecutionOptions } from '../../../src/types/config.js';

describe('Logger Utilities', () => {
  const testDir = path.resolve(process.cwd(), 'test-logs');
  const centralLogPath = path.join(testDir, 'central.jsonl');

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

    // Reset global logging config
    setLoggingConfig({});
  });

  describe('setLoggingConfig / getLoggingConfig', () => {
    it('should set and retrieve logging configuration', () => {
      const config: LoggingConfig = {
        centralLogPath: '/tmp/test.jsonl',
      };

      setLoggingConfig(config);
      const retrieved = getLoggingConfig();

      expect(retrieved).toEqual(config);
    });

    it('should return null when no config is set', () => {
      setLoggingConfig({});
      const config = getLoggingConfig();

      // After setting empty config, it should still be retrievable
      expect(config).toEqual({});
    });

    it('should warn when centralLogPath is not absolute', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config: LoggingConfig = {
        centralLogPath: 'relative/path.jsonl',
      };

      setLoggingConfig(config);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[logger] Warning: centralLogPath should be an absolute path:',
        'relative/path.jsonl'
      );

      consoleSpy.mockRestore();
    });

    it('should not warn when centralLogPath is absolute', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const config: LoggingConfig = {
        centralLogPath: '/absolute/path.jsonl',
      };

      setLoggingConfig(config);

      expect(consoleSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should allow updating the configuration', () => {
      const config1: LoggingConfig = {
        centralLogPath: '/tmp/first.jsonl',
      };
      setLoggingConfig(config1);
      expect(getLoggingConfig()).toEqual(config1);

      const config2: LoggingConfig = {
        centralLogPath: '/tmp/second.jsonl',
      };
      setLoggingConfig(config2);
      expect(getLoggingConfig()).toEqual(config2);
    });
  });

  describe('buildExecutionLogEntry', () => {
    it('should build a complete execution log entry', () => {
      const adapter = 'claude';
      const prompt = 'Test prompt';
      const options: ExecutionOptions = {
        logPath: '/tmp/logs/workflow-abc123/agent-1',
      };
      const response: AdapterResponse = {
        status: 'success',
        output: 'Test output',
        exitCode: 0,
        sessionId: 'session-xyz',
        duration: 1234,
        metadata: {},
        actions: [],
        events: [],
      };

      const entry = buildExecutionLogEntry(adapter, prompt, options, response);

      expect(entry.adapter).toBe('claude');
      expect(entry.prompt).toBe('Test prompt');
      expect(entry.options).toEqual(options);
      expect(entry.sessionId).toBe('session-xyz');
      expect(entry.workflowId).toBe('abc123');
      expect(entry.status).toBe('success');
      expect(entry.duration).toBe(1234);
      expect(entry.exitCode).toBe(0);
      expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO 8601 format
    });

    it('should extract workflowId from logPath pattern', () => {
      const options: ExecutionOptions = {
        logPath: '/home/user/logs/workflow-test-workflow-456/step-2',
      };
      const response: AdapterResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
        actions: [],
        events: [],
      };

      const entry = buildExecutionLogEntry('claude', 'test', options, response);

      expect(entry.workflowId).toBe('test-workflow-456');
    });

    it('should handle missing workflowId in logPath', () => {
      const options: ExecutionOptions = {
        logPath: '/tmp/logs/some-other-pattern',
      };
      const response: AdapterResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
        actions: [],
        events: [],
      };

      const entry = buildExecutionLogEntry('codex', 'test', options, response);

      expect(entry.workflowId).toBeUndefined();
    });

    it('should handle missing logPath', () => {
      const options: ExecutionOptions = {};
      const response: AdapterResponse = {
        status: 'failure',
        output: 'error',
        exitCode: 1,
        sessionId: 'sid',
        duration: 500,
        metadata: {},
        actions: [],
        events: [],
      };

      const entry = buildExecutionLogEntry('claude', 'test', options, response);

      expect(entry.workflowId).toBeUndefined();
      expect(entry.status).toBe('failure');
      expect(entry.exitCode).toBe(1);
    });
  });

  describe('writeToCentralLog', () => {
    it('should write entry to central log file', async () => {
      const config: LoggingConfig = { centralLogPath };
      setLoggingConfig(config);

      const entry: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        adapter: 'claude',
        prompt: 'Test prompt',
        options: {},
        sessionId: 'session-123',
        status: 'success',
        duration: 1000,
        exitCode: 0,
      };

      await writeToCentralLog(entry);

      const content = await readFile(centralLogPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed).toEqual(entry);
    });

    it('should append multiple entries to central log', async () => {
      const config: LoggingConfig = { centralLogPath };
      setLoggingConfig(config);

      const entry1: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        adapter: 'claude',
        prompt: 'First',
        options: {},
        sessionId: 'session-1',
        status: 'success',
        duration: 100,
        exitCode: 0,
      };

      const entry2: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        adapter: 'codex',
        prompt: 'Second',
        options: {},
        sessionId: 'session-2',
        status: 'success',
        duration: 200,
        exitCode: 0,
      };

      await writeToCentralLog(entry1);
      await writeToCentralLog(entry2);

      const content = await readFile(centralLogPath, 'utf-8');
      const lines = content.trim().split('\n');

      expect(lines).toHaveLength(2);
      expect(JSON.parse(lines[0])).toEqual(entry1);
      expect(JSON.parse(lines[1])).toEqual(entry2);
    });

    it('should do nothing when central logging not configured', async () => {
      setLoggingConfig({}); // No centralLogPath

      const entry: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        adapter: 'claude',
        prompt: 'Test',
        options: {},
        sessionId: 'session-123',
        status: 'success',
        duration: 100,
        exitCode: 0,
      };

      // Should not throw
      await writeToCentralLog(entry);

      // File should not exist
      let fileExists = true;
      try {
        await readFile(centralLogPath, 'utf-8');
      } catch {
        fileExists = false;
      }
      expect(fileExists).toBe(false);
    });

    it('should create parent directory if it does not exist', async () => {
      const nestedPath = path.join(testDir, 'nested', 'deep', 'central.jsonl');
      const config: LoggingConfig = { centralLogPath: nestedPath };
      setLoggingConfig(config);

      const entry: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        adapter: 'claude',
        prompt: 'Test',
        options: {},
        sessionId: 'session-123',
        status: 'success',
        duration: 100,
        exitCode: 0,
      };

      await writeToCentralLog(entry);

      const content = await readFile(nestedPath, 'utf-8');
      expect(content).toContain('Test');
    });

    it('should handle write errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Use an invalid path (directory instead of file)
      const invalidPath = path.join(testDir, 'dir-as-file');
      await mkdir(invalidPath);

      const config: LoggingConfig = { centralLogPath: invalidPath };
      setLoggingConfig(config);

      const entry: ExecutionLogEntry = {
        timestamp: new Date().toISOString(),
        adapter: 'claude',
        prompt: 'Test',
        options: {},
        sessionId: 'session-123',
        status: 'success',
        duration: 100,
        exitCode: 0,
      };

      // Should not throw, just log error
      await writeToCentralLog(entry);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[logger] Failed to write to central log:',
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('writeExecutionLogs', () => {
    it('should write all three log files', async () => {
      const logPath = path.join(testDir, 'execution-1');

      const input = {
        prompt: 'Test prompt',
        options: { timeout: 30000 },
      };

      const output: AdapterResponse = {
        status: 'success',
        output: 'Test output',
        exitCode: 0,
        sessionId: 'session-123',
        duration: 1000,
        metadata: { filesModified: ['test.ts'] },
        actions: [],
        events: [],
      };

      const events = [
        { type: 'system' as const, subtype: 'init' as const, timestamp: Date.now() },
        { type: 'assistant' as const, message: { content: 'Hello' }, timestamp: Date.now() },
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
      const output: AdapterResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
        actions: [],
        events: [],
      };
      const events: any[] = [];

      await writeExecutionLogs(logPath, input, output, events);

      const streamContent = await readFile(path.join(logPath, 'stream.jsonl'), 'utf-8');
      expect(streamContent).toBe('');
    });

    it('should create log directory if it does not exist', async () => {
      const logPath = path.join(testDir, 'nested', 'execution');

      const input = { prompt: 'Test' };
      const output: AdapterResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
        actions: [],
        events: [],
      };

      await writeExecutionLogs(logPath, input, output, []);

      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');
      expect(inputContent).toContain('Test');
    });

    it('should handle write errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Use a path that will cause permission issues
      const invalidPath = '/root/invalid-permission-test';

      const input = { prompt: 'Test' };
      const output: AdapterResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
        actions: [],
        events: [],
      };

      // Should not throw, just log error
      await writeExecutionLogs(invalidPath, input, output, []);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[logger] Failed to write execution logs'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });

    it('should write valid JSON with proper formatting', async () => {
      const logPath = path.join(testDir, 'execution-formatted');

      const input = { prompt: 'Test', nested: { key: 'value' } };
      const output: AdapterResponse = {
        status: 'success',
        output: '',
        exitCode: 0,
        sessionId: 'sid',
        duration: 100,
        metadata: {},
        actions: [],
        events: [],
      };

      await writeExecutionLogs(logPath, input, output, []);

      const inputContent = await readFile(path.join(logPath, 'input.json'), 'utf-8');

      // Should be pretty-printed with 2-space indentation
      expect(inputContent).toContain('  "prompt"');
      expect(inputContent).toContain('  "nested"');
    });
  });

  describe('Integration: Full logging workflow', () => {
    it('should handle complete logging workflow', async () => {
      // Setup
      const config: LoggingConfig = { centralLogPath };
      setLoggingConfig(config);

      // Simulate execution
      const adapter = 'claude';
      const prompt = 'Create a test file';
      const options: ExecutionOptions = {
        logPath: path.join(testDir, 'workflow-test123', 'agent-1'),
      };
      const response: AdapterResponse = {
        status: 'success',
        output: 'File created',
        exitCode: 0,
        sessionId: 'session-abc',
        duration: 2500,
        metadata: { filesModified: ['test.ts'] },
        actions: [{ type: 'write', path: 'test.ts' }],
        events: [
          { type: 'system' as const, subtype: 'init' as const, timestamp: Date.now() },
        ],
      };

      // Write per-execution logs
      const input = { prompt, options };
      await writeExecutionLogs(options.logPath!, input, response, response.events);

      // Write central log
      const entry = buildExecutionLogEntry(adapter, prompt, options, response);
      await writeToCentralLog(entry);

      // Verify per-execution logs
      const inputContent = await readFile(path.join(options.logPath!, 'input.json'), 'utf-8');
      const outputContent = await readFile(path.join(options.logPath!, 'output.json'), 'utf-8');
      const streamContent = await readFile(path.join(options.logPath!, 'stream.jsonl'), 'utf-8');

      expect(JSON.parse(inputContent).prompt).toBe(prompt);
      expect(JSON.parse(outputContent).sessionId).toBe('session-abc');
      expect(streamContent.trim().split('\n')).toHaveLength(1);

      // Verify central log
      const centralContent = await readFile(centralLogPath, 'utf-8');
      const centralEntry = JSON.parse(centralContent.trim());

      expect(centralEntry.adapter).toBe('claude');
      expect(centralEntry.workflowId).toBe('test123');
      expect(centralEntry.sessionId).toBe('session-abc');
      expect(centralEntry.status).toBe('success');
    });
  });
});
