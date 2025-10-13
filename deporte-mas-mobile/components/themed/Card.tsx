/**
 * Card Component
 *
 * Branded card container with two-tier background hierarchy.
 *
 * Variants:
 * - default: Primary card background (#111536)
 * - sub: Nested card background (#1D2255)
 *
 * @example
 * // Primary card
 * <Card>
 *   <ThemedText variant="title">Título</ThemedText>
 *
 *   // Nested sub-card
 *   <Card variant="sub">
 *     <ThemedText>Contenido secundario</ThemedText>
 *   </Card>
 * </Card>
 */

import { View, ViewProps, StyleSheet } from 'react-native';
import { Theme } from '../../constants/Theme';

export type CardProps = ViewProps & {
  variant?: 'default' | 'sub';
  children: React.ReactNode;
};

export function Card({
  variant = 'default',
  style,
  children,
  ...props
}: CardProps) {
  const backgroundColor =
    variant === 'default' ? Theme.colors.card : Theme.colors.subCard;

  return (
    <View style={[styles.card, { backgroundColor }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
  },
});
