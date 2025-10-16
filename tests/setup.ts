import { beforeAll, afterAll, vi } from 'vitest';

/**
 * Global test setup and configuration
 */

// Set up environment variables for testing
beforeAll(() => {
  // Ensure test environment is isolated
  process.env.NODE_ENV = 'test';

  // Mock CLI paths to prevent accidental real CLI invocations in unit tests
  process.env.CLAUDE_CLI_PATH = '/mock/path/to/claude';
  process.env.CODEX_CLI_PATH = '/mock/path/to/codex';
});

afterAll(() => {
  // Clean up mocks
  vi.clearAllMocks();
});

/**
 * Mock child_process.spawn for unit tests
 * Returns a mock ChildProcess that emits fixture data
 */
export function mockSpawn(fixtureData: string, options?: {
  exitCode?: number;
  stderr?: string;
  delay?: number;
}) {
  const exitCode = options?.exitCode ?? 0;
  const stderr = options?.stderr ?? '';
  const delay = options?.delay ?? 0;

  return vi.fn().mockImplementation(() => {
    const EventEmitter = require('events');
    const mockProcess = new EventEmitter();

    // Mock stdout stream
    mockProcess.stdout = new EventEmitter();
    mockProcess.stderr = new EventEmitter();
    mockProcess.kill = vi.fn();

    // Simulate async CLI execution
    setTimeout(() => {
      const lines = fixtureData ? fixtureData.split('\n').filter(line => line.trim()) : [];

      if (fixtureData && lines.length > 0) {
        // Emit data in chunks if it contains newlines (JSONL)
        lines.forEach((line, index) => {
          setTimeout(() => {
            mockProcess.stdout.emit('data', line + '\n');
          }, index * 10);
        });
      }

      if (stderr) {
        mockProcess.stderr.emit('data', stderr);
      }

      // Emit close event
      setTimeout(() => {
        mockProcess.emit('close', exitCode);
      }, lines.length * 10 + 50);
    }, delay);

    return mockProcess;
  });
}

/**
 * Helper to load fixture files
 */
export function loadFixture(filename: string): string {
  const fs = require('fs');
  const path = require('path');
  const fixturePath = path.join(__dirname, 'fixtures', filename);
  return fs.readFileSync(fixturePath, 'utf-8');
}
