import React, { useState, useEffect, useCallback } from 'react';
import { View, SafeAreaView, StatusBar, TouchableOpacity, Alert, Text, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import markdownit from 'markdown-it'
import hljs from 'highlight.js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { GiftedChat, InputToolbar, MessageText, Send } from 'react-native-gifted-chat';
import { useLocalSearchParams } from 'expo-router';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import useScheme from '@/hooks/useScheme';
import RenderHtml, { CustomBlockRenderer } from 'react-native-render-html';
const handleCopyCode = async (code: string) => {
  try {
    Clipboard.setStringAsync(code); // Clipboard API to copy code
    Alert.alert('Success', 'Code copied to clipboard!');
  } catch (error) {
    console.error('Error copying code:', error);
  }
}


export default function Chat() {
  const { prompt } = useLocalSearchParams() as { prompt: string };
  const [messages, setMessages] = useState([]);
  const [code, setCode] = useState('');
  const [renderers, setRenderers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const { colorScheme } = useScheme();
  const { width } = useWindowDimensions();

  const md = markdownit({
    highlight: (str: string, lang: string): string => {
      setCode(str);
      if (lang && hljs.getLanguage(lang)) {
        // console.log("Highlighting code block with language:", lang, str);
        try {
          return `<pre><div style='display:flex;flex-direction:row;justify-content:space-between'><p>${lang}</p><p>copy</p></div><code class="hljs language-${lang}">` +
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
            '</code></pre>';
        } catch (err) {
          console.error(err);
        }
      }

      return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  })
  useEffect(() => {
    const PreRenderer: CustomBlockRenderer = function PreRenderer({ TDefaultRenderer, ...props }) {
      return <TDefaultRenderer {...props} onPress={() => handleCopyCode(code)} />;
    };
    console.log("code", code);
    setRenderers({ pre: PreRenderer });
  }, [code]);

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
      const response = await fetch(`${process.env.EXPO_PUBLIC_GEMINI_API_URL!}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "contents": [{ "parts": [{ "text": text }] }] }),
      });
      const data = await response.json();
      // const data = "```python\nprint('Hello, World!')"

      // console.log(data.candidates[0].content.parts[0].text);
      setIsLoading(false);
      return data.candidates[0].content.parts[0].text;
      // return data;
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
            // avatar: 'https://raw.githubusercontent.com/2004durgesh/Nexa/main/assets/images/nexa.png',
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
              // avatar: 'https://raw.githubusercontent.com/2004durgesh/Nexa/main/assets/images/nexa.png',
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
    const messageText = currentMessage.text || "<p>Loading...</p>";
    // console.log("Rendering message text:", messageText);

    return currentMessage.user._id === 2 ? (
      <ThemedView darkColor={Colors["light"].background} lightColor={Colors["dark"].background} className='p-4 shrink-[1]'>
        <RenderHtml
          contentWidth={width}
          classesStyles={{
            hljs: {
              padding: 8,
              color: '#c9d1d9',
              backgroundColor: '#0d1117',
            },
            'hljs-comment': { color: '#8b949e' },
            'hljs-punctuation': { color: '#8b949e' },
            'hljs-attr': { color: '#79c0ff' },
            'hljs-attribute': { color: '#79c0ff' },
            'hljs-meta': { color: '#79c0ff' },
            'hljs-selector-attr': { color: '#79c0ff' },
            'hljs-selector-class': { color: '#79c0ff' },
            'hljs-selector-id': { color: '#79c0ff' },
            'hljs-variable': { color: '#ffa657' },
            'hljs-literal': { color: '#ffa657' },
            'hljs-number': { color: '#ffa657' },
            'hljs-doctag': { color: '#ffa657' },
            'hljs-params': { color: '#c9d1d9' },
            'hljs-function': { color: '#d2a8ff' },
            'hljs-class': { color: '#7ee787' },
            'hljs-tag': { color: '#7ee787' },
            'hljs-title': { color: '#7ee787' },
            'hljs-built_in': { color: '#7ee787' },
            'hljs-keyword': { color: '#ff7b72' },
            'hljs-type': { color: '#ff7b72' },
            'hljs-builtin-name': { color: '#ff7b72' },
            'hljs-meta-keyword': { color: '#ff7b72' },
            'hljs-template-tag': { color: '#ff7b72' },
            'hljs-template-variable': { color: '#ff7b72' },
            'hljs-string': { color: '#a5d6ff' },
            'hljs-undefined': { color: '#a5d6ff' },
            'hljs-regexp': { color: '#a5d6ff' },
            'hljs-symbol': { color: '#79c0ff' },
            'hljs-bullet': { color: '#ffa657' },
            'hljs-section': { color: '#79c0ff', fontWeight: 'bold' },
            'hljs-quote': { color: '#7ee787' },
            'hljs-name': { color: '#7ee787' },
            'hljs-selector-tag': { color: '#7ee787' },
            'hljs-selector-pseudo': { color: '#7ee787' },
            'hljs-emphasis': { color: '#ffa657', fontStyle: 'italic' },
            'hljs-strong': { color: '#ffa657', fontWeight: 'bold' },
            'hljs-deletion': { color: '#ffa198', backgroundColor: '#490202' },
            'hljs-addition': { color: '#7ee787', backgroundColor: '#04260f' },
            'hljs-link': { color: '#a5d6ff', fontStyle: 'normal' },

          }}
          tagsStyles={{
            body: {
              color: "#808080",
              width: width * 0.8,
              
            },
            li: {
              margin: 0,
            }
          }}
          renderers={renderers}
          source={{
            html: `
            <html>
              <head>
              </head>
              <body>
                ${md.render(messageText)}
              </body>
            </html>
          ` }}
        />
      </ThemedView>
    ) : (
      <MessageText {...props} textStyle={{ color: Colors[colorScheme ?? "light"].text }} />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme ?? "light"].background }} >
      <GiftedChat
        messages={messages}
        alwaysShowSend
        isTyping={isLoading || waitingForResponse}
        onSend={onSend}
        renderInputToolbar={customInputToolbar}
        renderFooter={() => null}
        renderChatFooter={() => null}
        renderSend={(props) => (
          <Send {...props} containerStyle={{ justifyContent: "center" }}>
            <Ionicons name="arrow-up-circle" size={40} color="black" />
          </Send>
        )}
        renderMessageText={renderMessageText}
        renderAvatar={() => null}
        renderTime={() => null}
        user={{ _id: 1 }}
      />
    </SafeAreaView>
  );
}
