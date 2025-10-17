import type { AdapterResponse } from '../types/config';

/**
 * Operation function that returns a Promise
 */
export type AsyncOperation<T = AdapterResponse> = () => Promise<T>;

/**
 * Execute operations sequentially (one after another)
 * @param operations Array of async operations to execute
 * @returns Array of results in order
 */
export async function sequential<T = AdapterResponse>(
  operations: AsyncOperation<T>[]
): Promise<T[]> {
  const results: T[] = [];

  for (const operation of operations) {
    const result = await operation();
    results.push(result);
  }

  return results;
}

/**
 * Execute operations in parallel (all at once)
 * @param operations Array of async operations to execute
 * @returns Array of results in order
 */
export async function parallel<T = AdapterResponse>(
  operations: AsyncOperation<T>[]
): Promise<T[]> {
  return Promise.all(operations.map(op => op()));
}

/**
 * Execute operations in waterfall (passing results between operations)
 * Each operation receives the result of the previous operation
 * @param operations Array of operations where each can use the previous result
 * @returns Final result
 */
export async function waterfall<T = AdapterResponse>(
  operations: Array<(input?: T) => Promise<T>>
): Promise<T | undefined> {
  let result: T | undefined;

  for (const operation of operations) {
    result = await operation(result);
  }

  return result;
}

/**
 * Retry an operation with exponential backoff
 * @param operation The operation to retry
 * @param options Retry options
 * @returns Result of the operation
 */
export async function retry<T = AdapterResponse>(
  operation: AsyncOperation<T>,
  options: {
    /** Maximum number of retry attempts */
    maxAttempts?: number;
    /** Initial delay in milliseconds */
    initialDelay?: number;
    /** Maximum delay in milliseconds */
    maxDelay?: number;
    /** Backoff multiplier */
    backoffMultiplier?: number;
    /** Function to determine if error should trigger retry */
    shouldRetry?: (error: Error, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (attempt === maxAttempts || !shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError || new Error('Retry failed');
}

/**
 * Race multiple operations (return first to complete)
 * @param operations Array of operations to race
 * @returns Result of the first completed operation
 */
export async function race<T = AdapterResponse>(
  operations: AsyncOperation<T>[]
): Promise<T> {
  return Promise.race(operations.map(op => op()));
}
