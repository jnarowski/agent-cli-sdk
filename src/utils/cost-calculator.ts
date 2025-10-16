import type { TokenUsage, ModelUsage } from '../types/config.js';

/**
 * Pricing information for OpenAI models (as of 2025)
 * Source: https://openai.com/api/pricing/
 */
export interface ModelPricing {
  /** Price per 1M input tokens in USD */
  inputPer1M: number;
  /** Price per 1M output tokens in USD */
  outputPer1M: number;
  /** Prompt caching discount (0-1, where 0.75 = 75% discount) */
  cachingDiscount?: number;
}

/**
 * Pricing table for OpenAI models
 */
export const OPENAI_MODEL_PRICING: Record<string, ModelPricing> = {
  // GPT-5 Family (Latest - August 2025)
  'gpt-5': {
    inputPer1M: 3.0,
    outputPer1M: 12.0,
  },
  'gpt-5-mini': {
    inputPer1M: 1.5,
    outputPer1M: 6.0,
    cachingDiscount: 0.75,
  },
  'gpt-5-nano': {
    inputPer1M: 0.5,
    outputPer1M: 2.0,
  },
  'gpt-5-pro': {
    inputPer1M: 5.0,
    outputPer1M: 20.0,
  },

  // GPT-4.5 Family (February 2025)
  'gpt-4.5': {
    inputPer1M: 2.5,
    outputPer1M: 10.0,
  },
  'gpt-4.5-preview': {
    inputPer1M: 2.0,
    outputPer1M: 8.0,
  },

  // GPT-4.1 Family (April 2025)
  'gpt-4.1': {
    inputPer1M: 2.0,
    outputPer1M: 8.0,
  },
  'gpt-4.1-mini': {
    inputPer1M: 1.0,
    outputPer1M: 4.0,
  },
  'gpt-4.1-nano': {
    inputPer1M: 0.4,
    outputPer1M: 1.6,
  },

  // GPT-4 Family
  'gpt-4': {
    inputPer1M: 30.0,
    outputPer1M: 60.0,
  },
  'gpt-4-turbo': {
    inputPer1M: 10.0,
    outputPer1M: 30.0,
  },
  'gpt-4o': {
    inputPer1M: 5.0,
    outputPer1M: 15.0,
  },

  // GPT-3.5 Family
  'gpt-3.5-turbo': {
    inputPer1M: 0.5,
    outputPer1M: 1.5,
  },

  // Reasoning Models (o-series)
  'o3': {
    inputPer1M: 10.0,
    outputPer1M: 40.0,
  },
  'o3-mini': {
    inputPer1M: 1.1,
    outputPer1M: 4.4,
  },
  'o4-mini': {
    inputPer1M: 1.1,
    outputPer1M: 4.4,
  },
  'o4-mini-high': {
    inputPer1M: 3.5,
    outputPer1M: 14.0,
  },
  'o1': {
    inputPer1M: 15.0,
    outputPer1M: 60.0,
  },
  'o1-preview': {
    inputPer1M: 15.0,
    outputPer1M: 60.0,
  },
  'o1-mini': {
    inputPer1M: 3.0,
    outputPer1M: 12.0,
  },

  // Codex-specific models
  'codex-mini-latest': {
    inputPer1M: 1.5,
    outputPer1M: 6.0,
    cachingDiscount: 0.75,
  },
  'codex-1': {
    inputPer1M: 10.0,
    outputPer1M: 40.0,
  },
};

/**
 * Pricing information for Anthropic Claude models (as of 2025)
 */
export const CLAUDE_MODEL_PRICING: Record<string, ModelPricing> = {
  'claude-sonnet-4-5-20250929': {
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  'claude-haiku-4-5-20251001': {
    inputPer1M: 1.0,
    outputPer1M: 5.0,
  },
  'claude-3-5-sonnet-20241022': {
    inputPer1M: 3.0,
    outputPer1M: 15.0,
  },
  'claude-3-5-haiku-20241022': {
    inputPer1M: 1.0,
    outputPer1M: 5.0,
  },
  'claude-3-opus-20240229': {
    inputPer1M: 15.0,
    outputPer1M: 75.0,
  },
};

/**
 * Calculate the cost in USD for a given token usage and model
 */
export function calculateCost(usage: TokenUsage, model: string): number {
  // Try to find pricing for the specific model
  let pricing = OPENAI_MODEL_PRICING[model] || CLAUDE_MODEL_PRICING[model];

  // If exact model not found, try to match by prefix
  if (!pricing) {
    const modelPrefix = model.split('-')[0];
    const allPricing = { ...OPENAI_MODEL_PRICING, ...CLAUDE_MODEL_PRICING };
    const matchingKey = Object.keys(allPricing).find(key => key.startsWith(modelPrefix));
    if (matchingKey) {
      pricing = allPricing[matchingKey];
    }
  }

  // If still no pricing found, return 0
  if (!pricing) {
    return 0;
  }

  const inputTokens = usage.inputTokens || 0;
  const outputTokens = usage.outputTokens || 0;
  const cachedTokens = usage.cacheReadInputTokens || 0;

  // Calculate input cost
  let inputCost = (inputTokens / 1_000_000) * pricing.inputPer1M;

  // Apply caching discount if available and cached tokens are present
  if (pricing.cachingDiscount && cachedTokens > 0) {
    const cachedCost = (cachedTokens / 1_000_000) * pricing.inputPer1M * pricing.cachingDiscount;
    inputCost += cachedCost;
  }

  // Calculate output cost
  const outputCost = (outputTokens / 1_000_000) * pricing.outputPer1M;

  return inputCost + outputCost;
}

/**
 * Create a ModelUsage object with calculated cost
 */
export function createModelUsage(
  usage: TokenUsage,
  model: string,
  contextWindow?: number
): ModelUsage {
  return {
    ...usage,
    costUSD: calculateCost(usage, model),
    contextWindow,
  };
}
