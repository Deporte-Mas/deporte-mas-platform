/**
 * Deporte Más Brand Colors
 *
 * Centralized color tokens for consistent branding across the app.
 * Never use hardcoded hex values - always reference these tokens.
 */

export const Colors = {
  background: '#090B1C',
  card: '#111536',
  subCard: '#1D2255',
  text: '#FFFFFF',
  impact: {
    red: '#E12F23',
    blue: '#222DC2',
  },
  gradient: {
    start: '#222DC2',
    end: '#E12F23',
  },
} as const;

export type ColorToken = typeof Colors;
