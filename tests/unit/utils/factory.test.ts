import { describe, it, expect } from 'vitest';
import { createClaudeAdapter, createCodexAdapter } from '../../../src/utils/factory';
import { ClaudeAdapter } from '../../../src/adapters/claude/index';
import { CodexAdapter } from '../../../src/adapters/codex/index';
import { CLINotFoundError } from '../../../src/core/errors';
import { writeFileSync, unlinkSync, chmodSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('Factory Functions', () => {
  describe('createClaudeAdapter', () => {
    it('should throw CLINotFoundError when CLI not found', () => {
      const originalPath = process.env.CLAUDE_CLI_PATH;
      process.env.CLAUDE_CLI_PATH = '/nonexistent/path/to/claude';

      try {
        expect(() => createClaudeAdapter()).toThrow(CLINotFoundError);
      } finally {
        if (originalPath) {
          process.env.CLAUDE_CLI_PATH = originalPath;
        } else {
          delete process.env.CLAUDE_CLI_PATH;
        }
      }
    });

    it('should create adapter when CLI is available', () => {
      const originalPath = process.env.CLAUDE_CLI_PATH;
      const tempPath = join(tmpdir(), 'test-claude-factory');
      writeFileSync(tempPath, '#!/bin/bash\necho "mock"');
      chmodSync(tempPath, 0o755);

      try {
        process.env.CLAUDE_CLI_PATH = tempPath;
        const adapter = createClaudeAdapter({ apiKey: 'test' });
        expect(adapter).toBeInstanceOf(ClaudeAdapter);
      } finally {
        unlinkSync(tempPath);
        if (originalPath) {
          process.env.CLAUDE_CLI_PATH = originalPath;
        } else {
          delete process.env.CLAUDE_CLI_PATH;
        }
      }
    });
  });

  describe('createCodexAdapter', () => {
    it('should throw CLINotFoundError when CLI not found', () => {
      const originalPath = process.env.CODEX_CLI_PATH;
      process.env.CODEX_CLI_PATH = '/nonexistent/path/to/codex';

      try {
        expect(() => createCodexAdapter()).toThrow(CLINotFoundError);
      } finally {
        if (originalPath) {
          process.env.CODEX_CLI_PATH = originalPath;
        } else {
          delete process.env.CODEX_CLI_PATH;
        }
      }
    });

    it('should create adapter when CLI is available', () => {
      const originalPath = process.env.CODEX_CLI_PATH;
      const tempPath = join(tmpdir(), 'test-codex-factory');
      writeFileSync(tempPath, '#!/bin/bash\necho "mock"');
      chmodSync(tempPath, 0o755);

      try {
        process.env.CODEX_CLI_PATH = tempPath;
        const adapter = createCodexAdapter({ apiKey: 'test' });
        expect(adapter).toBeInstanceOf(CodexAdapter);
      } finally {
        unlinkSync(tempPath);
        if (originalPath) {
          process.env.CODEX_CLI_PATH = originalPath;
        } else {
          delete process.env.CODEX_CLI_PATH;
        }
      }
    });
  });
});
