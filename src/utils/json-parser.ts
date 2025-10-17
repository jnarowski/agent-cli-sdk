/**
 * JSON extraction and validation utilities for parsing CLI output
 */

/**
 * Extract JSON from text that may contain mixed content
 * Tries multiple strategies in order of preference
 */
export function extractJsonFromOutput(text: string): unknown {
  if (!text || typeof text !== 'string') {
    return null;
  }

  // Strategy 1: Look for ```json markdown code blocks
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```/;
  const jsonBlockMatch = text.match(jsonBlockRegex);

  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1].trim());
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 2: Look for first JSON object in text
  const jsonObjectRegex = /\{[\s\S]*\}/;
  const jsonObjectMatch = text.match(jsonObjectRegex);

  if (jsonObjectMatch && jsonObjectMatch[0]) {
    try {
      return JSON.parse(jsonObjectMatch[0]);
    } catch {
      // Failed to parse
    }
  }

  // No valid JSON found
  return null;
}

/**
 * Validate data against a Zod schema
 * Dynamically imports Zod to handle optional peer dependency
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function validateWithSchema<T = any>(
  data: unknown,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any
): Promise<{
  success: boolean;
  data: T | null;
  errors?: string[];
}> {
  // Validate with safeParse (never throws)
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data as T,
    };
  } else {
    // Format Zod issues into readable strings (Zod 4.x uses 'issues' instead of 'errors')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errors = result.error.issues.map((err: any) => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    });

    return {
      success: false,
      data: data as T, // Return raw data as best effort
      errors,
    };
  }
}
