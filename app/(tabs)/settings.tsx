import { View, Text, Button, TouchableOpacity, Image, Linking, Alert } from 'react-native';
import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-expo'
import { HelloWave } from '@/components/HelloWave';
import { ThemedText } from '@/components/ThemedText';
import { Link } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { storage } from '@/components/MMKVStorage';
import useScheme from '@/hooks/useScheme';
import * as WebBrowser from 'expo-web-browser';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
const Settings = () => {
  const { signOut } = useAuth();
  const { user } = useUser()
  const { colorScheme, setColorScheme } = useScheme();

  const _handlePressButtonAsync = async (url: string) => {
    await WebBrowser.openBrowserAsync(url);

  };
  console.log(user, "user");
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView className='flex-1'>
        <View className=' px-4 flex flex-row items-center gap-4 m-4'>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Image source={{ uri: user?.imageUrl }} style={{ width: 50, height: 50 }} className='rounded-full' />
            </DropdownMenuTrigger>
            <DropdownMenuContent className='w-72'>
              <ThemedView invert className="rounded-lg">
                <DropdownMenuGroup>
                  <DropdownMenuItem onPress={() => _handlePressButtonAsync('https://github.com/2004durgesh/Nexa')}>
                    <Ionicons name="star-outline" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
                    <ThemedText invert>Leave a star</ThemedText>
                  </DropdownMenuItem>
                  <DropdownMenuItem onPress={() => signOut()} className='flex-1 flex flex-row items-center gap-4'>
                    <Ionicons name="log-out-outline" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
                    <ThemedText invert>Sign Out</ThemedText>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </ThemedView>
            </DropdownMenuContent>
          </DropdownMenu>
          <View>
            <ThemedText type="subtitle" className='text-lg'>{user?.firstName}</ThemedText>
            <ThemedText>{user?.emailAddresses[0].emailAddress}</ThemedText>
          </View>
          <HelloWave />
        </View>

        <TouchableOpacity onPress={() => storage.clearAll()} className='bg-destructive p-4 m-4 rounded-lg'>
          <ThemedText>Clear All History</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => signOut()} className='bg-destructive p-4 m-4 rounded-lg'>
          <ThemedText>SignOut</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')} className='bg-destructive p-4 m-4 rounded-lg'>
          <ThemedText>Toggle Theme</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </SafeAreaView>
  );
};

export default Settings;
