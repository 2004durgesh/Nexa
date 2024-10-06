import { View, Text } from 'react-native'
import React from 'react'
import { ThemedText } from '@/components/ThemedText'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { ThemedView } from '@/components/ThemedView'
import SignInWithOAuth from './SignInWithOAuth'
import Loading from '@/components/Loading'


const AuthLayout = () => {
  return (
    <>
      <ThemedView className="flex-1 relative">
        <View className='flex-1 absolute inset-0 -z-10 h-full w-full'>
          <Loading/>
        </View>
        <View className='flex-1 absolute z-50 inset-0 bottom-0 w-full'>
          <SignInWithOAuth />
        </View>
      </ThemedView>
    </>
  )
}

export default AuthLayout