import { useColorScheme as useNativewindColorScheme } from 'nativewind';

export default function useScheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } =
    useNativewindColorScheme();
  return {
    colorScheme: colorScheme ?? 'dark',
    isDarkColorScheme: colorScheme === 'dark',
    setColorScheme,
    toggleColorScheme,
  };
}