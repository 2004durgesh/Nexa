import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { ClerkProvider, useAuth } from "@clerk/clerk-expo"
import { useColorScheme } from '@/hooks/useColorScheme';
import * as SecureStore from "expo-secure-store";
import "../global.css"
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


const InitialLayout = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  console.log(segments, "segments");
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    console.log('User signed: ', isSignedIn);
    console.log('In auth group: ', inAuthGroup);

    if (true && inAuthGroup) {
      // Redirect to the tabs group if the user is signed in.
      console.log("redirecting to tabs");
      router.replace('/(tabs)');
    } else if (!isSignedIn) {
      // Redirect to the auth group if the user is not signed in.
      router.replace('/(auth)');
    }
  }, [isSignedIn]);

  if (!isLoaded) {
    return <Text>Loading.....</Text>;
  }
  return <Slot />;
};

const tokenCache = {
  async getToken(key: string) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value);
    } catch (err) {
      return;
    }
  },
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ClerkProvider tokenCache={tokenCache} publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <GestureHandlerRootView>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          {/* <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack> */}
          <InitialLayout />
        </ThemeProvider>
      </GestureHandlerRootView>
    </ClerkProvider>
  );
}
