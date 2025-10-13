/**
 * Deporte Más Typography System
 *
 * Font configuration and loading for brand typography.
 *
 * Fonts:
 * - Title: RomaGothic Bold (Adobe Fonts)
 * - Body: Geist from @expo-google-fonts
 */

import { Colors } from './Colors';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';

export const Typography = {
  fonts: {
    title: 'RomaGothic-Bold',
    body: 'Geist_400Regular',
  },
  styles: {
    title: {
      fontFamily: 'RomaGothic-Bold',
      textTransform: 'uppercase' as const,
      color: Colors.text,
    },
    body: {
      fontFamily: 'Geist_400Regular',
      fontWeight: '400' as const,
      color: Colors.text,
    },
  },
} as const;

/**
 * Font Assets for expo-font loader
 * - RomaGothic Bold from assets/fonts
 * - Geist from @expo-google-fonts
 */
export const fontAssets = {
  'RomaGothic-Bold': require('../assets/fonts/ramagothicbold.ttf'),
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
};

export type TypographyToken = typeof Typography;
