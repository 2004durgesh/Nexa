import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, SafeAreaView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GiftedChat, InputToolbar, MessageText, Send } from 'react-native-gifted-chat';
import { useLocalSearchParams } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function Explore() {
  const { prompt } = useLocalSearchParams() as { prompt: string };
  const [messages, setMessages] = useState<{ _id: string; text: string; createdAt: Date; user: { _id: number; name: string; avatar: string; }; }[]>([]);
  const [data, setData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      try {
        const response = await fetch(`${process.env.API_URL!}/chat/process-text`,{
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: prompt }),
        });
        const data = await response.json();
        setData(data);
        setIsLoading(false);
        return data
      } catch (error: any) {
        console.log('error', error.message);
        setData(error.message);
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  useEffect(() => {
    const initialMessage = {
      _id: uuidv4(),
      text: prompt,
      createdAt: new Date(),
      user: {
        _id: 1,
        name: 'Me',
        avatar: 'https://avatars.githubusercontent.com/u/104310762?v=4&size=64',
      },
    };

    setMessages([initialMessage]);

      const initialResponse = {
        _id: uuidv4(),
        text: data,
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'Chatbot',
          avatar: 'https://avatars.githubusercontent.com/u/388375?s=48&v=4',
        },
      };

      setMessages(previousMessages => GiftedChat.append(previousMessages, [initialResponse]));

  }, [prompt]);

  const onSend = useCallback((messages: any[] = []) => {
    console.log('onSend triggered. Messages:', messages);

    setMessages(previousMessages => {
      const newMessages = GiftedChat.append(previousMessages, messages);
      console.log('Messages after user sends:', newMessages);

      if (messages[0].user._id === 1 && !waitingForResponse) {
        console.log('User message detected. Waiting for response.');

        setWaitingForResponse(true);

        setTimeout(() => {
          const responseMessage = {
            _id: uuidv4(),
            text: `# h1 Heading 8-)\n\nchatbot generating response for "${messages[0].text}"\n\nThis is normal text`,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'Chatbot',
              avatar: 'https://avatars.githubusercontent.com/u/388375?s=48&v=4',
            },
          };

          console.log('Response timer expired. Appending response:', responseMessage);
          setMessages(previousMessages => GiftedChat.append(previousMessages, [responseMessage]));
          setWaitingForResponse(false);
          console.log('Response appended. Reset waitingForResponse to false.');
        }, 1000);
      }

      return newMessages;
    });
  }, [waitingForResponse]);

  const customInputToolbar = props => {
    return (
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
  };

  const renderMessageText = (props) => {
    const { currentMessage } = props;
    if (currentMessage.user._id === 2) {
      return (
        <View style={{ padding: 10 }}>
          <Markdown>
            {currentMessage.text}
          </Markdown>
        </View>
      );
    }
    return <MessageText {...props} />;
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <GiftedChat
        messages={messages}
        alwaysShowSend
        isTyping={isLoading}
        onSend={messages => onSend(messages)}
        isKeyboardInternallyHandled={false}
        renderInputToolbar={props => customInputToolbar(props)}
        renderChatFooter={() => (<View style={{ paddingBottom: 50 }} />)}
        renderSend={props => (
          <Send {...props} containerStyle={{ justifyContent: "center" }}>
            <Ionicons name="arrow-up-circle" size={40} color="black" />
          </Send>
        )}
        renderMessageText={renderMessageText}
        user={{
          _id: 1,
        }}
      />
    </SafeAreaView>
  );
}
