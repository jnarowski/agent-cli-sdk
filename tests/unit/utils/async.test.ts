import { describe, it, expect, vi } from 'vitest';
import { sequential, parallel, waterfall, retry } from '../../../src/utils/async';

describe('Async Utilities', () => {
  describe('sequential', () => {
    it('should execute operations in order', async () => {
      const results: number[] = [];
      const operations = [
        async () => { results.push(1); return 1; },
        async () => { results.push(2); return 2; },
        async () => { results.push(3); return 3; },
      ];

      const values = await sequential(operations);

      expect(results).toEqual([1, 2, 3]);
      expect(values).toEqual([1, 2, 3]);
    });

    it('should stop on first error', async () => {
      const results: number[] = [];
      const operations = [
        async () => { results.push(1); return 1; },
        async () => { throw new Error('Operation failed'); },
        async () => { results.push(3); return 3; },
      ];

      await expect(sequential(operations)).rejects.toThrow('Operation failed');
      expect(results).toEqual([1]); // Third operation should not run
    });
  });

  describe('parallel', () => {
    it('should execute operations concurrently', async () => {
      const startTimes: number[] = [];
      const operations = [
        async () => { startTimes.push(Date.now()); await delay(10); return 1; },
        async () => { startTimes.push(Date.now()); await delay(10); return 2; },
        async () => { startTimes.push(Date.now()); await delay(10); return 3; },
      ];

      const values = await parallel(operations);

      expect(values).toEqual([1, 2, 3]);
      // All operations should start around the same time (within 5ms)
      const maxDiff = Math.max(...startTimes) - Math.min(...startTimes);
      expect(maxDiff).toBeLessThan(5);
    });

    it('should collect all errors', async () => {
      const operations = [
        async () => { throw new Error('Error 1'); },
        async () => { return 2; },
        async () => { throw new Error('Error 3'); },
      ];

      await expect(parallel(operations)).rejects.toThrow();
    });
  });

  describe('waterfall', () => {
    it('should pass results between operations', async () => {
      const operations = [
        async () => 5,
        async (x: number) => x * 2,
        async (x: number) => x + 3,
      ];

      const result = await waterfall(operations);

      expect(result).toBe(13); // (5 * 2) + 3
    });

    it('should work with async transformations', async () => {
      const operations = [
        async () => 'hello',
        async (s: string) => { await delay(10); return s.toUpperCase(); },
        async (s: string) => { await delay(10); return `${s} WORLD`; },
      ];

      const result = await waterfall(operations);

      expect(result).toBe('HELLO WORLD');
    });

    it('should stop on first error', async () => {
      const operations = [
        async () => 5,
        async (x: number) => { throw new Error('Failed at step 2'); },
        async (x: number) => x + 3,
      ];

      await expect(waterfall(operations)).rejects.toThrow('Failed at step 2');
    });
  });

  describe('retry', () => {
    it('should succeed on first attempt', async () => {
      const operation = vi.fn(async () => 'success');

      const result = await retry(operation, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const operation = vi.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retry(operation, { maxAttempts: 3 });

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max attempts', async () => {
      const operation = vi.fn(async () => {
        throw new Error('Always fails');
      });

      await expect(
        retry(operation, { maxAttempts: 3 })
      ).rejects.toThrow('Always fails');

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should respect delay between retries', async () => {
      const timestamps: number[] = [];
      const operation = vi.fn(async () => {
        timestamps.push(Date.now());
        throw new Error('Fail');
      });

      await expect(
        retry(operation, { maxAttempts: 3, delayMs: 50 })
      ).rejects.toThrow();

      // Check that there's approximately 50ms between attempts
      for (let i = 1; i < timestamps.length; i++) {
        const diff = timestamps[i] - timestamps[i - 1];
        expect(diff).toBeGreaterThanOrEqual(40); // Allow some variance
      }
    });

    it('should use exponential backoff when configured', async () => {
      const timestamps: number[] = [];
      const operation = vi.fn(async () => {
        timestamps.push(Date.now());
        throw new Error('Fail');
      });

      await expect(
        retry(operation, {
          maxAttempts: 3,
          delayMs: 10,
          exponentialBackoff: true,
        })
      ).rejects.toThrow();

      // Second delay should be longer than first delay
      const delay1 = timestamps[1] - timestamps[0];
      const delay2 = timestamps[2] - timestamps[1];
      expect(delay2).toBeGreaterThan(delay1);
    });
  });
});

// Helper function
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
