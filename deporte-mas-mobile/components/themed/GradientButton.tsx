/**
 * GradientButton Component
 *
 * Branded button with blue-to-red horizontal gradient.
 * Text is automatically uppercase using ThemedText.
 *
 * Features:
 * - Blue (#222DC2) to Red (#E12F23) gradient
 * - Horizontal direction (left to right)
 * - Touch feedback with activeOpacity
 * - Disabled state support
 *
 * @example
 * <GradientButton
 *   title="Ingresar"
 *   onPress={handleLogin}
 *   disabled={loading}
 * />
 */

import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '../../constants/Theme';
import { ThemedText } from './ThemedText';

export type GradientButtonProps = {
  onPress: () => void;
  title: string;
  disabled?: boolean;
  style?: ViewStyle;
};

export function GradientButton({
  onPress,
  title,
  disabled = false,
  style,
}: GradientButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <LinearGradient
        colors={[Theme.colors.gradient.start, Theme.colors.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <ThemedText variant="body" style={styles.buttonText}>
          {title}
        </ThemedText>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 10, // Fully rounded/pill shape
  },
  gradient: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10, // Match container for proper clipping
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
