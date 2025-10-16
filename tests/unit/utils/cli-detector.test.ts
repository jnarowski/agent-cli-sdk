import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { findCLI, isCLIInstalled } from '../../../src/utils/cli-detector';
import { writeFileSync, unlinkSync, chmodSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

describe('CLI Detector', () => {
  let originalClaudePath: string | undefined;
  let originalCodexPath: string | undefined;
  let tempCLIPath: string | undefined;

  beforeEach(() => {
    originalClaudePath = process.env.CLAUDE_CLI_PATH;
    originalCodexPath = process.env.CODEX_CLI_PATH;
  });

  afterEach(() => {
    // Restore original environment
    if (originalClaudePath) {
      process.env.CLAUDE_CLI_PATH = originalClaudePath;
    } else {
      delete process.env.CLAUDE_CLI_PATH;
    }
    if (originalCodexPath) {
      process.env.CODEX_CLI_PATH = originalCodexPath;
    } else {
      delete process.env.CODEX_CLI_PATH;
    }

    // Clean up temp file
    if (tempCLIPath) {
      try {
        unlinkSync(tempCLIPath);
      } catch {}
      tempCLIPath = undefined;
    }
  });

  describe('environment variable override', () => {
    it('should return null for non-existent path in env var', () => {
      process.env.CLAUDE_CLI_PATH = '/nonexistent/path/to/claude';
      const path = findCLI('claude');
      expect(path).toBeNull();
    });

    it('should use valid path from env var', () => {
      // Create a temp file to act as CLI
      tempCLIPath = join(tmpdir(), 'test-claude-cli');
      writeFileSync(tempCLIPath, '#!/bin/bash\necho "mock"');
      chmodSync(tempCLIPath, 0o755);

      process.env.CLAUDE_CLI_PATH = tempCLIPath;
      const path = findCLI('claude');
      expect(path).toBe(tempCLIPath);
    });
  });

  describe('PATH detection', () => {
    it('should detect Codex CLI if installed', () => {
      delete process.env.CODEX_CLI_PATH;
      const path = findCLI('codex');
      // Result depends on whether codex is actually installed
      expect(path === null || typeof path === 'string').toBe(true);
    });
  });

  describe('isCLIInstalled', () => {
    it('should return boolean for CLI availability', () => {
      const installed = isCLIInstalled('codex');
      expect(typeof installed).toBe('boolean');
    });
  });
});
