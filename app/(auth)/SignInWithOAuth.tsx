import React from "react";
import * as WebBrowser from "expo-web-browser";
import { Button, Text, TouchableOpacity, View } from "react-native";
import { useWarmUpBrowser } from "@/hooks/useWarmUpBrowser";
import { useOAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import useScheme from "@/hooks/useScheme";
WebBrowser.maybeCompleteAuthSession();
enum Strategy {
  Google = 'oauth_google',
  Apple = 'oauth_apple',
  Facebook = 'oauth_facebook',
}
const SignInWithOAuth = () => {
  const { colorScheme } = useScheme();
  useWarmUpBrowser();
  const router = useRouter();
  const { startOAuthFlow: googleAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: appleAuth } = useOAuth({ strategy: 'oauth_apple' });
  const { startOAuthFlow: facebookAuth } = useOAuth({ strategy: 'oauth_facebook' });

  const onSelectAuth = async (strategy: Strategy) => {
    const selectedAuth = {
      [Strategy.Google]: googleAuth,
      [Strategy.Apple]: appleAuth,
      [Strategy.Facebook]: facebookAuth,
    }[strategy];
    try {
      const { createdSessionId, setActive } = await selectedAuth();

      if (createdSessionId) {
        setActive!({ session: createdSessionId });
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.error('OAuth error', err);
    }
  };


  return (
    <View className="gap-5 p-4">
      {/* <TouchableOpacity
            onPress={() => console.log('Button Pressed!')}
            style={{ padding: 20, backgroundColor: 'blue' }}
          >
            <Text style={{ color: 'white' }}>Test Button</Text>
          </TouchableOpacity> */}

      <ThemedView invert className="rounded-full shadow-lg">
        <TouchableOpacity className={` flex-row items-center justify-center px-10 py-4 w-full`} onPress={() => onSelectAuth(Strategy.Apple)}>
          <Ionicons name="logo-apple" size={30} color={colorScheme === "light" ? `#fcfdfe` : "#020407"} className="absolute left-10" />
          <ThemedText invert className="font-bold">Apple</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView invert className="rounded-full shadow-lg">
        <TouchableOpacity className={` flex-row items-center justify-center px-10 py-4 w-full`} onPress={() => onSelectAuth(Strategy.Google)}>
          <Ionicons name="logo-google" size={30} color={colorScheme === "light" ? `#fcfdfe` : "#020407"} className="absolute left-10" />
          <ThemedText invert className="font-bold">Google</ThemedText>
        </TouchableOpacity>
      </ThemedView>

      <ThemedView invert className="rounded-full  shadow-lg">
        <TouchableOpacity className={` flex-row items-center justify-center px-10 py-4 w-full`} onPress={() => onSelectAuth(Strategy.Google)}>
          <Ionicons name="logo-facebook" size={30} color={colorScheme === "light" ? `#fcfdfe` : "#020407"} className="absolute left-10" />
          <ThemedText invert className="font-bold">Facebook</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </View>
  );
}
export default SignInWithOAuth;