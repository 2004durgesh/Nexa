import { View, TouchableOpacity, FlatList, RefreshControl, Modal, TextInput, Button } from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storage } from '@/components/MMKVStorage';
import { useRouter } from 'expo-router';
import { Content } from '@/constants/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import useScheme from '@/hooks/useScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useFocusEffect } from '@react-navigation/native';

const History = () => {
  const [sessions, setSessions] = useState<{ sessionId: string, prompt: string }[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [newPrompt, setNewPrompt] = useState('');
  const router = useRouter();
  const { colorScheme } = useScheme();
  const insets = useSafeAreaInsets();
  console.log(storage.getAllKeys());
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  // Function to load session data from storage
  const loadSessionData = () => {
    const keys = storage.getAllKeys();
    const sessionList = keys
      .filter(key => key && key !== 'theme' && key !== 'undefined' && key !== 'null')
      .map(key => {
        try {
          const contents: Content[] = JSON.parse(storage.getString(key) || '[]');
          const promptText = contents.length > 0 && contents[0].parts[0].text ? contents[0].parts[0].text : 'No prompt';
          return { sessionId: key, prompt: promptText };
        } catch (error) {
          console.error(`Error parsing JSON for key ${key}:`, error);
          return { sessionId: key, prompt: 'Invalid data' };
        }
      });
    setSessions(sessionList);
  };

  // Handle pull-to-refresh action
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadSessionData();
    setIsRefreshing(false);
  };

  // Load session data on component mount
  useEffect(() => {
    loadSessionData();
  }, []);

  // Handle rename action
  const handleRename = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    const session = sessions.find(s => s.sessionId === sessionId);
    setNewPrompt(session?.prompt || '');
    setIsRenameModalVisible(true);
  };

  // Save the new prompt
  const saveNewPrompt = () => {
    if (currentSessionId) {
      try {
        const contents: Content[] = JSON.parse(storage.getString(currentSessionId) || '[]');
        if (contents.length > 0) {
          contents[0].parts[0].text = newPrompt;
          storage.set(currentSessionId, JSON.stringify(contents));
          loadSessionData();
        }
        setIsRenameModalVisible(false);
      } catch (error) {
        console.error(`Error parsing JSON for key ${currentSessionId}:`, error);
      }
    }
  };

  // Render each session item in the FlatList
  const renderSessionItem = ({ item }: { item: { sessionId: string, prompt: string } }) => (
    <View className="flex flex-row items-center mx-4 my-2 p-2 rounded-lg">
      <Ionicons name="timer-outline" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} className="p-1" />

      <TouchableOpacity
        onPress={() => { router.push(`/chat?sessionId=${item.sessionId}`), console.log(item.sessionId) }}
        className="flex-1 ml-2"
      >
        <ThemedText type="defaultSemiBold" numberOfLines={2} className="w-full shrink-[1]">
          {item.prompt}
        </ThemedText>
      </TouchableOpacity>

      <DropdownMenu className=''>
        <DropdownMenuTrigger>
          <Ionicons name="ellipsis-vertical" size={24} color={colorScheme === 'dark' ? 'white' : 'black'} className="p-1" />
        </DropdownMenuTrigger>

        <DropdownMenuContent insets={contentInsets} className="w-64 native:w-72 ">
          <ThemedView invert className="rounded-lg">

            <DropdownMenuGroup>
              <DropdownMenuItem onPress={() => { storage.delete(item.sessionId); loadSessionData(); }} className=" flex-1 flex flex-row items-center gap-4">
                <Ionicons name="trash-outline" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
                <ThemedText invert>Delete</ThemedText>
              </DropdownMenuItem>

              <DropdownMenuItem onPress={() => handleRename(item.sessionId)} className="flex-1 flex flex-row items-center gap-4">
                <Ionicons name="brush-outline" size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />
                <ThemedText invert>Rename</ThemedText>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </ThemedView>
        </DropdownMenuContent>
      </DropdownMenu>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ThemedView className='flex-1'>
        <FlatList
          data={sessions}
          renderItem={renderSessionItem}
          keyExtractor={item => item.sessionId}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center">
              <ThemedText>No sessions found</ThemedText>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />

        <Modal
          visible={isRenameModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsRenameModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-opacity-25">
            <View className="w-[80%] bg-white p-6 rounded-lg">
              <ThemedText type="defaultSemiBold" invert className="text-lg mb-4">Rename Prompt</ThemedText>
              <TextInput
                value={newPrompt}
                onChangeText={setNewPrompt}
                className="border-b border-gray-300 mb-6 p-2 text-base"
                placeholder="Enter new prompt name"
              />
              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={saveNewPrompt}
                  className="bg-blue-500 py-2 px-4 rounded-lg"
                >
                  <ThemedText className="text-white">Save</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsRenameModalVisible(false)}
                  className="bg-gray-500 py-2 px-4 rounded-lg"
                >
                  <ThemedText className="text-white">Cancel</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </SafeAreaView>
  );
};

export default History;