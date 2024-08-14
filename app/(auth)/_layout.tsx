import { View, Text } from 'react-native'
import React from 'react'
import { ThemedText } from '@/components/ThemedText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import SignInWithOAuth from './SignInWithOAuth'


const AuthLayout = () => {
  return (
    <ThemedView className="flex-1 bg-red-500">
      <SafeAreaView className=" bg-red-500">
        <SignInWithOAuth />
      </SafeAreaView>
    </ThemedView>
  )
}

export default AuthLayout