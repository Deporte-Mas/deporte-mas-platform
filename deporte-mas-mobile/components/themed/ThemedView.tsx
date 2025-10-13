/**
 * ThemedView Component
 *
 * View component with branded background color for screen containers.
 * Automatically applies the Deporte Más dark background.
 *
 * @example
 * <ThemedView>
 *   <ThemedText variant="title">Screen Content</ThemedText>
 * </ThemedView>
 */

import { View, ViewProps } from 'react-native';
import { Theme } from '../../constants/Theme';

export type ThemedViewProps = ViewProps & {
  children: React.ReactNode;
};

export function ThemedView({ style, children, ...props }: ThemedViewProps) {
  return (
    <View
      style={[{ backgroundColor: Theme.colors.background, flex: 1 }, style]}
      {...props}
    >
      {children}
    </View>
  );
}
