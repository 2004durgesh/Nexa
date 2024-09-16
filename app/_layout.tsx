import { DarkTheme, DefaultTheme, ThemeProvider,Theme } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ClerkProvider, useAuth } from "@clerk/clerk-expo"
import useScheme from '@/hooks/useScheme';
import * as SecureStore from "expo-secure-store";
import "../global.css"
import { Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from '@rn-primitives/portal';
import { Colors } from '@/constants/Colors';

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
      const item = await SecureStore.getItemAsync(key)
      if (item) {
        console.log(`${key} was used 🔐 \n`)
      } else {
        console.log('No values stored under key: ' + key)
      }
      return item
    } catch (error) {
      console.error('SecureStore get item error: ', error)
      await SecureStore.deleteItemAsync(key)
      return null
    }
  },
  async saveToken(key: string, value: string) {
    try {
      return SecureStore.setItemAsync(key, value)
    } catch (err) {
      return
    }
  },
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useScheme()

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
    <>
      <ClerkProvider tokenCache={tokenCache} publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
        <GestureHandlerRootView>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <InitialLayout />
          </ThemeProvider>
          <PortalHost />
        </GestureHandlerRootView>
      </ClerkProvider>
    </>
  );
}
