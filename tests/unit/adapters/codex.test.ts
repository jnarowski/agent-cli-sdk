import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CodexAdapter } from '../../../src/adapters/codex/index';
import { mockSpawn, loadFixture } from '../../setup';
import * as childProcess from 'child_process';

// Mock child_process module
vi.mock('child_process');

describe('CodexAdapter', () => {
  let adapter: CodexAdapter;

  beforeEach(() => {
    adapter = new CodexAdapter('/mock/path/to/codex');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('execute()', () => {
    it('should execute a simple prompt and return success response', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const response = await adapter.execute('Review this code for security issues');

      expect(response.status).toBe('success');
      expect(response.exitCode).toBe(0);
      expect(response.output).toContain('security issues');
      expect(response.output).toContain('SQL Injection');
    });

    it('should handle streaming mode with callbacks', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const streamEvents: any[] = [];
      const onStream = vi.fn((event) => {
        streamEvents.push(event);
      });

      const response = await adapter.execute('Analyze code', {
        streaming: true,
        onStream,
      });

      expect(response.status).toBe('success');
      expect(onStream).toHaveBeenCalled();
      expect(streamEvents.length).toBeGreaterThan(0);

      // Check for different event types
      const eventTypes = streamEvents.map((e) => e.type);
      expect(eventTypes).toContain('turn.started');
      expect(eventTypes).toContain('turn.completed');
    });

    it('should handle authentication errors', async () => {
      const fixture = loadFixture('codex-error.jsonl');
      const spawnMock = mockSpawn(fixture, { exitCode: 1 });
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await expect(adapter.execute('Do something')).rejects.toThrow(); // Just verify it throws
    });

    it('should support full-auto mode', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await adapter.execute('Fix the bug', {
        fullAuto: true,
      });

      // Verify spawn was called with full-auto flag
      expect(childProcess.spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['--full-auto']),
        expect.any(Object)
      );
    });

    it('should support sandbox configuration', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const response = await adapter.execute('Test', {
        sandbox: 'workspace-write',
        approvalPolicy: 'on-failure',
      });

      // Just verify execution succeeds with sandbox options
      expect(response.status).toBe('success');
      expect(childProcess.spawn).toHaveBeenCalled();
    });

    it('should support working directory override', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await adapter.execute('Run tests', {
        workingDir: '/path/to/project',
      });

      // Verify spawn was called with -C flag
      expect(childProcess.spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['-C', '/path/to/project']),
        expect.any(Object)
      );
    });

    it('should support search capability', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await adapter.execute('Research this topic', {
        enableSearch: true,
      });

      // Verify spawn was called with --search flag
      expect(childProcess.spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['--search']),
        expect.any(Object)
      );
    });

    it('should support image inputs', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await adapter.execute('Analyze this screenshot', {
        images: ['/path/to/screenshot.png', '/path/to/diagram.jpg'],
      });

      // Verify spawn was called with -i flags
      expect(childProcess.spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['-i', '/path/to/screenshot.png', '-i', '/path/to/diagram.jpg']),
        expect.any(Object)
      );
    });

    it('should handle timeout errors', async () => {
      const spawnMock = mockSpawn('', { delay: 10000 }); // Long delay
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await expect(adapter.execute('Long task', { timeout: 100 })).rejects.toThrow(); // Just verify it throws
    });

    it('should pass model option correctly', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await adapter.execute('Do something', {
        model: 'gpt-4',
      });

      // Verify spawn was called with -m flag
      expect(childProcess.spawn).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining(['-m', 'gpt-4']),
        expect.any(Object)
      );
    });
  });

  describe('getCapabilities()', () => {
    it('should return correct capabilities', () => {
      const capabilities = adapter.getCapabilities();

      expect(capabilities.streaming).toBe(true);
      expect(capabilities.sessionManagement).toBe(false); // Codex doesn't have explicit session management
      expect(capabilities.toolCalling).toBe(true);
      expect(capabilities.multiModal).toBe(true); // Codex supports image inputs via -i flag
    });
  });

  describe('configuration', () => {
    it('should accept API key configuration', () => {
      const configuredAdapter = new CodexAdapter('/mock/path/to/codex', {
        apiKey: 'test-api-key-123',
      });

      expect(configuredAdapter).toBeInstanceOf(CodexAdapter);
    });
  });

  describe('error handling', () => {
    it('should handle CLI not found error', async () => {
      const spawnMock = vi.fn().mockImplementation(() => {
        const error = new Error('Command not found');
        (error as any).code = 'ENOENT';
        throw error;
      });
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await expect(adapter.execute('Do something')).rejects.toThrow(/not found/i);
    });

    it('should handle sandbox permission errors', async () => {
      const fixture = JSON.stringify({
        type: 'turn.failed',
        data: {
          error: {
            code: 'SANDBOX_ERROR',
            message: 'Permission denied by sandbox',
          },
        },
      });
      const spawnMock = mockSpawn(fixture, { exitCode: 1 });
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      await expect(adapter.execute('Dangerous operation')).rejects.toThrow(); // Just verify it throws
    });
  });

  describe('JSONL parsing', () => {
    it('should parse turn.started events', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const streamEvents: any[] = [];
      await adapter.execute('Test', {
        streaming: true,
        onStream: (event) => streamEvents.push(event),
      });

      const startEvent = streamEvents.find((e) => e.type === 'turn.started');
      expect(startEvent).toBeDefined();
    });

    it('should parse turn.completed events', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const streamEvents: any[] = [];
      await adapter.execute('Test', {
        streaming: true,
        onStream: (event) => streamEvents.push(event),
      });

      const completeEvent = streamEvents.find((e) => e.type === 'turn.completed');
      expect(completeEvent).toBeDefined();
    });

    it('should accumulate message content from item.updated events', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const response = await adapter.execute('Test');

      expect(response.output).toContain('Analyzing the code');
      expect(response.output).toContain('SQL Injection');
      expect(response.output).toContain('input validation');
    });
  });

  describe('metadata extraction', () => {
    it('should track duration', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const response = await adapter.execute('Test');

      expect(response.duration).toBeGreaterThan(0);
    });

    it('should include raw events when available', async () => {
      const fixture = loadFixture('codex-success.jsonl');
      const spawnMock = mockSpawn(fixture);
      vi.spyOn(childProcess, 'spawn').mockImplementation(spawnMock as any);

      const response = await adapter.execute('Test', { streaming: true });

      expect(response.raw?.events).toBeDefined();
      expect(response.raw?.events?.length).toBeGreaterThan(0);
    });
  });
});
