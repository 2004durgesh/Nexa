import React, { useState, useEffect, useCallback } from 'react';
import { View, SafeAreaView,StatusBar } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GiftedChat, InputToolbar, MessageText, Send } from 'react-native-gifted-chat';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function Explore() {
  const { prompt } = useLocalSearchParams() as { prompt: string };
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const colorScheme = useColorScheme();

  useFocusEffect(
    useCallback(() => {
      // Set status bar color to red when the screen is focused
      StatusBar.setBackgroundColor('black');

      return () => {
        // Revert status bar color to default when the screen is unfocused
        StatusBar.setBackgroundColor('transparent');
      };
    }, [])
  );
  const fetchChatbotResponse = async (text: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL!}/chat/process-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await response.json();
      console.log(data);
      setIsLoading(false);
      return data;
    } catch (error: any) {
      console.log('Error fetching chatbot response:', error.message);
      setIsLoading(false);
      return error.message;
    }
  };

  useEffect(() => {
    if (prompt) {
      const initialMessage = {
        _id: uuidv4(),
        text: prompt,
        createdAt: new Date(),
        user: {
          _id: 1,
          name: 'Me',
        },
      };

      // Display the prompt message immediately
      setMessages([initialMessage]);

      // Fetch the response for the prompt
      fetchChatbotResponse(prompt).then((data) => {
        const initialResponse = {
          _id: uuidv4(),
          text: data,
          createdAt: new Date(),
          user: {
            _id: 2,
            name: 'Chatbot',
            avatar: 'https://raw.githubusercontent.com/2004durgesh/Nexa/main/assets/images/nexa.png',
          },
        };

        setMessages(previousMessages => GiftedChat.append(previousMessages, [initialResponse]));
      });
    }
  }, [prompt]);

  const onSend = useCallback((messages: any[] = []) => {
    setMessages(previousMessages => {
      const newMessages = GiftedChat.append(previousMessages, messages);

      if (messages[0].user._id === 1 && !waitingForResponse) {
        setWaitingForResponse(true);
        fetchChatbotResponse(messages[0].text).then((data) => {
          const responseMessage = {
            _id: uuidv4(),
            text: data,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Chatbot',
              avatar: 'https://raw.githubusercontent.com/2004durgesh/Nexa/main/assets/images/nexa.png',
            },
          };

          setMessages(previousMessages => GiftedChat.append(previousMessages, [responseMessage]));
          setWaitingForResponse(false);
        });
      }

      return newMessages;
    });
  }, [waitingForResponse]);

  const customInputToolbar = (props) => (
    <InputToolbar
      {...props}
      containerStyle={{
        backgroundColor: "white",
        borderTopColor: "#E8E8E8",
        borderTopWidth: 1,
        padding: 4,
        borderRadius: 5,
        marginVertical: 10,
        marginHorizontal: 10,
      }}
    />
  );

  const renderMessageText = (props) => {
    const { currentMessage } = props;
    return currentMessage.user._id === 2 ? (
      <ThemedView style={{ padding: 10}}>
        <Markdown>
          {currentMessage.text}
        </Markdown>
      </ThemedView>
    ) : (
      <MessageText {...props} textStyle={{color:Colors[colorScheme ?? "light"].text}}/>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1}}>
      <GiftedChat
        messages={messages}
        alwaysShowSend
        isTyping={isLoading || waitingForResponse}
        onSend={onSend}
        isKeyboardInternallyHandled={false}
        renderInputToolbar={customInputToolbar}
        renderChatFooter={() => (<View style={{ paddingBottom: 50 }} />)}
        renderSend={(props) => (
          <Send {...props} containerStyle={{ justifyContent: "center" }}>
            <Ionicons name="arrow-up-circle" size={40} color="black" />
          </Send>
        )}
        renderMessageText={renderMessageText}
        user={{ _id: 1 }}
      />
    </SafeAreaView>
  );
}
