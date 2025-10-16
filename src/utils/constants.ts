import type { Options as BoxenOptions } from 'boxen';

/**
 * Shared box styling constants for consistent UI across the SDK
 */
export const BOX_STYLES = {
  /** Full-width box with standard margins and padding */
  fullWidth: {
    padding: 1,
    margin: 1,
    width: process.stdout.columns || 80,
    minWidth: 60,
  } satisfies Partial<BoxenOptions>,

  /** Compact box with minimal spacing */
  compact: {
    padding: 0,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  } satisfies Partial<BoxenOptions>,
} as const;

/**
 * Border styles for different box types
 */
export const BORDER_STYLES = {
  info: {
    borderStyle: 'round',
    borderColor: 'blue',
  } satisfies Partial<BoxenOptions>,

  success: {
    borderStyle: 'round',
    borderColor: 'green',
  } satisfies Partial<BoxenOptions>,

  warning: {
    borderStyle: 'round',
    borderColor: 'yellow',
  } satisfies Partial<BoxenOptions>,

  error: {
    borderStyle: 'round',
    borderColor: 'red',
  } satisfies Partial<BoxenOptions>,
} as const;
