import useScheme from './useScheme';
import { Colors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string }, 
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark, 
  invert = false
) {
  const { colorScheme } = useScheme();

  // Swap light and dark theme colors based on the invert flag
  const lightColor = invert ? Colors.dark[colorName] : Colors.light[colorName];
  const darkColor = invert ? Colors.light[colorName] : Colors.dark[colorName];

  // Return the default color based on the current color scheme
  return colorScheme === 'light' ? lightColor : darkColor;
}
