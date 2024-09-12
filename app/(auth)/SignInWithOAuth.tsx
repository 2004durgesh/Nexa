import React from "react";
import * as WebBrowser from "expo-web-browser";
import { Button, TouchableOpacity, View } from "react-native";
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
  const {colorScheme} = useScheme();
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
    <ThemedView>
      <View className="gap-5 h-full justify-end -mb-10">
          <TouchableOpacity className={`flex-row justify-start items-center px-10 py-4 ${colorScheme === "light" ? "bg-dark-background" : "bg-light-background"} mx-4 rounded-full`} onPress={() => onSelectAuth(Strategy.Apple)}>
            <Ionicons name="logo-apple" size={30} color={colorScheme === "light" ? `#fcfdfe` : "#020407"}/>
            <ThemedText type="defaultSemiBold" lightColor="#fcfdfe" darkColor="#020407" className="text-center flex-1">Apple</ThemedText>
          </TouchableOpacity>
        <TouchableOpacity className={`flex-row justify-start items-center px-10 py-4 ${colorScheme === "light" ? "bg-dark-background" : "bg-light-background"} mx-4 rounded-full`} onPress={() => onSelectAuth(Strategy.Google)}>
          <Ionicons name="logo-google" size={30}color={colorScheme === "light" ? `#fcfdfe` : "#020407"}/>
          <ThemedText type="defaultSemiBold" lightColor="#fcfdfe" darkColor="#020407" className="text-center flex-1">Google</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity className={`flex-row justify-start items-center px-10 py-4 ${colorScheme === "light" ? "bg-dark-background" : "bg-light-background"} mx-4 rounded-full`} onPress={() => onSelectAuth(Strategy.Facebook)}>
          <Ionicons name="logo-facebook" size={30} color={colorScheme === "light" ? `#fcfdfe` : "#020407"}/>
          <ThemedText type="defaultSemiBold" lightColor="#fcfdfe" darkColor="#020407" className="text-center flex-1">Facebook</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}
export default SignInWithOAuth;