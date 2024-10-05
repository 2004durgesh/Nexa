import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  invert?: boolean; // Add the invert prop
};

export function ThemedView({ style, lightColor, darkColor, invert = false,...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background',invert);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
