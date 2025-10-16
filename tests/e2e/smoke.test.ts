import { describe, it, expect, beforeAll } from 'vitest';
import { createClaudeAdapter, createCodexAdapter } from '../../src/index';
import { ClaudeAdapter } from '../../src/adapters/claude/index';
import { CodexAdapter } from '../../src/adapters/codex/index';

/**
 * E2E Smoke Tests
 *
 * These tests use real CLI binaries and are skipped by default.
 * Enable with: RUN_E2E_TESTS=true npm test
 *
 * Prerequisites:
 * - Claude CLI installed and authenticated (claude setup-token)
 * - Codex CLI installed and authenticated (codex login)
 */

const shouldRunE2E = process.env.RUN_E2E_TESTS === 'true';
const describeE2E = shouldRunE2E ? describe : describe.skip;

describeE2E('E2E Smoke Tests', () => {
  let claudeAdapter: ClaudeAdapter;
  let codexAdapter: CodexAdapter;

  beforeAll(() => {
    try {
      claudeAdapter = createClaudeAdapter();
      codexAdapter = createCodexAdapter();
    } catch (error) {
      console.error('Failed to create adapters:', error);
      throw error;
    }
  });

  describe('Claude Adapter E2E', () => {
    it('should execute simple prompt and get response', async () => {
      const response = await claudeAdapter.execute(
        'Say "Hello from Claude!" and nothing else',
        { timeout: 60000 }
      );

      expect(response.status).toBe('success');
      expect(response.exitCode).toBe(0);
      expect(response.output).toContain('Hello');
      expect(response.sessionId).toBeDefined();
      expect(response.duration).toBeGreaterThan(0);
    }, 90000); // 90s timeout

    it('should support streaming mode', async () => {
      const streamEvents: any[] = [];
      let receivedSystemInit = false;
      let receivedAssistantMessage = false;
      let receivedResult = false;

      const response = await claudeAdapter.execute(
        'Count from 1 to 3, one number per line',
        {
          streaming: true,
          timeout: 60000,
          onStream: (event) => {
            streamEvents.push(event);
            if (event.type === 'system' && event.subtype === 'init') {
              receivedSystemInit = true;
            }
            if (event.type === 'assistant' && event.message?.content) {
              receivedAssistantMessage = true;
            }
            if (event.type === 'result') {
              receivedResult = true;
            }
          },
        }
      );

      expect(response.status).toBe('success');
      expect(streamEvents.length).toBeGreaterThan(0);
      expect(receivedSystemInit).toBe(true);
      expect(receivedAssistantMessage).toBe(true);
      expect(receivedResult).toBe(true);
    }, 90000);

    it('should handle file operations', async () => {
      const response = await claudeAdapter.execute(
        'Create a temporary file /tmp/test-sdk-claude.txt with content "Test from SDK"',
        { timeout: 60000 }
      );

      expect(response.status).toBe('success');
      expect(response.metadata.filesModified).toBeDefined();
      expect(response.actions).toBeDefined();

      // Check if Write tool was used
      const hasWriteAction = response.actions?.some(
        action => action.type === 'write'
      );
      expect(hasWriteAction).toBe(true);
    }, 90000);
  });

  describe('Codex Adapter E2E', () => {
    it('should execute simple prompt and get response', async () => {
      const response = await codexAdapter.execute(
        'Say "Hello from Codex!" and nothing else',
        {
          fullAuto: true,
          timeout: 60000,
        }
      );

      expect(response.status).toBe('success');
      expect(response.exitCode).toBe(0);
      expect(response.output).toContain('Hello');
      expect(response.duration).toBeGreaterThan(0);
    }, 90000);

    it('should support streaming mode', async () => {
      const streamEvents: any[] = [];

      const response = await codexAdapter.execute(
        'Count from 1 to 3',
        {
          streaming: true,
          fullAuto: true,
          timeout: 60000,
          onStream: (event) => {
            streamEvents.push(event);
          },
        }
      );

      expect(response.status).toBe('success');
      expect(streamEvents.length).toBeGreaterThan(0);
    }, 90000);

    it('should work with sandbox restrictions', async () => {
      const response = await codexAdapter.execute(
        'List files in current directory',
        {
          sandbox: 'read-only',
          timeout: 60000,
        }
      );

      expect(response.status).toBe('success');
    }, 90000);
  });

  describe('Multi-Agent Workflow E2E', () => {
    it('should coordinate between Claude and Codex', async () => {
      // Step 1: Claude generates code
      const step1 = await claudeAdapter.execute(
        'Write a simple function to a temp file /tmp/test-multi-agent.js that adds two numbers',
        { timeout: 60000 }
      );

      expect(step1.status).toBe('success');
      const generatedFiles = step1.metadata.filesModified || [];
      expect(generatedFiles.length).toBeGreaterThan(0);

      // Step 2: Codex reviews the code
      const step2 = await codexAdapter.execute(
        'Review the file /tmp/test-multi-agent.js and check if it works correctly',
        {
          fullAuto: true,
          timeout: 60000,
        }
      );

      expect(step2.status).toBe('success');
      expect(step2.output.length).toBeGreaterThan(0);

      // Step 3: Claude makes improvements based on review
      const reviewFeedback = step2.output.substring(0, 500); // Use first part of review
      const step3 = await claudeAdapter.execute(
        `Based on this review: "${reviewFeedback}", improve /tmp/test-multi-agent.js if needed`,
        {
          sessionId: step1.sessionId, // Resume Claude's session
          timeout: 60000,
        }
      );

      expect(step3.status).toBe('success');
      expect(step3.sessionId).toBe(step1.sessionId); // Should be same session
    }, 180000); // 3 minute timeout for full workflow
  });

  describe('Error Handling E2E', () => {
    it('should handle invalid operations gracefully', async () => {
      const response = await claudeAdapter.execute(
        'Please delete the entire system',
        { timeout: 30000 }
      );

      // Should either succeed with explanation or fail with clear error
      expect(response).toBeDefined();
      // Most likely Claude will refuse and explain why
      expect(response.output).toBeDefined();
    }, 60000);

    it('should handle timeout correctly', async () => {
      await expect(
        claudeAdapter.execute(
          'Think deeply about this for a very long time',
          { timeout: 1000 } // Very short timeout
        )
      ).rejects.toThrow();
    }, 10000);
  });
});
