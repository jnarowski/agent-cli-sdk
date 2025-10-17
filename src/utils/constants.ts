import type { Options as BoxenOptions } from 'boxen';

/**
 * Shared box styling constants for consistent UI across the SDK
 */
export const BOX_STYLES: {
  readonly fullWidth: Partial<BoxenOptions>;
  readonly compact: Partial<BoxenOptions>;
} = {
  /** Full-width box with standard margins and padding */
  fullWidth: {
    padding: 1,
    margin: 1,
  },

  /** Compact box with minimal spacing */
  compact: {
    padding: 0,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  },
} as const;

/**
 * Border styles for different box types
 */
export const BORDER_STYLES: {
  readonly info: Partial<BoxenOptions>;
  readonly success: Partial<BoxenOptions>;
  readonly warning: Partial<BoxenOptions>;
  readonly error: Partial<BoxenOptions>;
} = {
  info: {
    borderStyle: 'round',
    borderColor: 'blue',
  },

  success: {
    borderStyle: 'round',
    borderColor: 'green',
  },

  warning: {
    borderStyle: 'round',
    borderColor: 'yellow',
  },

  error: {
    borderStyle: 'round',
    borderColor: 'red',
  },
} as const;
