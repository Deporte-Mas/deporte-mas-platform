/**
 * ThemedText Component
 *
 * Text component that automatically applies Deporte Más typography rules.
 *
 * Features:
 * - Automatic uppercase transformation for title variant
 * - Brand color application
 * - Type-safe style merging
 *
 * @example
 * // Title (automatically uppercase)
 * <ThemedText variant="title">Revive los mejores momentos</ThemedText>
 *
 * // Body text
 * <ThemedText variant="body">Descripción del contenido</ThemedText>
 */

import { Text, TextProps } from 'react-native';
import { Theme } from '../../constants/Theme';

export type ThemedTextProps = TextProps & {
  variant?: 'title' | 'body';
  color?: string;
};

export function ThemedText({
  variant = 'body',
  style,
  children,
  color,
  ...props
}: ThemedTextProps) {
  const textStyle =
    variant === 'title'
      ? Theme.typography.styles.title
      : Theme.typography.styles.body;

  // Transform title text to uppercase
  const processedChildren =
    variant === 'title' && typeof children === 'string'
      ? children.toUpperCase()
      : children;

  return (
    <Text style={[textStyle, color && { color }, style]} {...props}>
      {processedChildren}
    </Text>
  );
}
