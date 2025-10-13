/**
 * Deporte Más Theme Configuration
 *
 * Unified theme export combining colors, typography, spacing, and border radius.
 * Import this module to access all theme tokens.
 *
 * @example
 * import { Theme } from '../constants/Theme';
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     backgroundColor: Theme.colors.background,
 *     padding: Theme.spacing.md,
 *   },
 * });
 */

import { Colors } from './Colors';
import { Typography } from './Typography';

export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
  },
} as const;

export type ThemeType = typeof Theme;

// Re-export for convenience
export { Colors } from './Colors';
export { Typography } from './Typography';
