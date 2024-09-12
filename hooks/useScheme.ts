import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const useScheme = () => {
  const deviceScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(deviceScheme || 'light');

  useEffect(() => {
    setColorScheme(deviceScheme || 'light');
  }, [deviceScheme]);

  const toggleScheme = () => {
    setColorScheme((prevScheme) => (prevScheme === 'light' ? 'dark' : 'light'));
  };

  return { colorScheme, toggleScheme };
};

export default useScheme;
