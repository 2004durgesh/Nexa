import React, { useState, useEffect, useCallback } from 'react';
import { View, SafeAreaView, StatusBar, Alert, useWindowDimensions } from 'react-native';
import { GiftedChat, IMessage, InputToolbar, InputToolbarProps, MessageText, MessageTextProps, Send } from 'react-native-gifted-chat';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import markdownit from 'markdown-it';
import hljs from 'highlight.js';
import Ionicons from '@expo/vector-icons/Ionicons';
import { v4 as uuidv4 } from 'uuid';
import RenderHtml, { CustomBlockRenderer } from 'react-native-render-html';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import useScheme from '@/hooks/useScheme';
import { Content, Message, Role, Part, User } from '@/constants/types';
import { storage } from '@/components/MMKVStorage';
import { useRouter } from 'expo-router';

// Helper functions
const handleCopyCode = async (code: string) => {
  try {
    await Clipboard.setStringAsync(code);
    Alert.alert('Success', 'Code copied to clipboard!');
  } catch (error) {
    console.error('Error copying code:', error);
  }
}

const convertMessagesToContents = (messages: Message[]): Content[] => {
  return messages.map(message => ({
    role: message.user._id === 1 ? Role.user : Role.model,
    parts: [{ text: message.text }],
  })).reverse();
};

const convertContentsToMessages = (contents: Content[]): Message[] => {
  return contents.reverse().map((content, index) => ({
    _id: index,
    text: content.parts[0].text || '',
    createdAt: new Date(),
    user: { _id: content.role === Role.user ? 1 : 2, name: content.role === Role.user ? 'Me' : 'Chatbot' },
  }));
};

// Main component
export default function Chat() {
  const { prompt, sessionId: initialSessionId } = useLocalSearchParams() as { prompt: string, sessionId: string };
  const [sessionId, setSessionId] = useState<string>(initialSessionId || uuidv4());
  const [messages, setMessages] = useState<Message[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const [code, setCode] = useState('');
  const [renderers, setRenderers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const { colorScheme } = useScheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
console.log(sessionId,"from chat");
  // Markdown rendering configuration
  const md = markdownit({
    highlight: (str: string, lang: string): string => {
      setCode(str);
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre><div style='display:flex;flex-direction:row;justify-content:space-between'><p>${lang}</p></div><code class="hljs language-${lang}">` +
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
            '</code></pre>';
        } catch (err) {
          console.error(err);
        }
      }
      return `<pre><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  // Effect to set up custom block renderer
  useEffect(() => {
    const PreRenderer: CustomBlockRenderer = function PreRenderer({ TDefaultRenderer, ...props }) {
      return <TDefaultRenderer {...props} onPress={() => handleCopyCode(code)} />;
    };
    setRenderers({ pre: PreRenderer });
  }, [code]);

  // Effect to handle messages and contents
  useEffect(() => {
    const storedContents = storage.getString(`${sessionId}`);
    console.log("Stored contents for session:", sessionId, storedContents);
    if (storedContents) {
      const parsedContents = JSON.parse(storedContents) as Content[];
      const loadedMessages = convertContentsToMessages(parsedContents);
      console.log("Loaded messages for session:", sessionId, loadedMessages);
      setMessages(loadedMessages);
    } else {
      console.log("No stored content found for session:", sessionId);
    }
  }, [sessionId]);
  

  useEffect(() => {
    setContents(convertMessagesToContents(messages));
  }, [messages]);

  useEffect(() => {
    storage.set(`${sessionId}`, JSON.stringify(contents));
    console.log("storing contents for session:", sessionId, contents, JSON.stringify(contents));
  }, [contents, sessionId]);

  // Effect to handle focus and status bar color
  useFocusEffect(
    useCallback(() => {
      StatusBar.setBackgroundColor('black');
      return () => {
        StatusBar.setBackgroundColor('transparent');
      };
    }, [])
  );

  // Fetch chatbot response
  const fetchChatbotResponse = async (contents: Content[]) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_GEMINI_API_URL!}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contents }),
      });
      const data = await response.json();

      //dummy data to lessen the api calls
//       const data = `# h1 Heading 8-)
// **This is some bold text!**
// This is normal text
// `;
      setIsLoading(false);
      return data?.candidates[0]?.content?.parts[0]?.text;
      // return data;
    } catch (error: any) {
      console.log('Error fetching chatbot response:', error.message);
      setIsLoading(false);
    }
  };

  // Effect to handle prompt and initial response
  useEffect(() => {
    if (prompt) {
      const initialMessage = {
        _id: uuidv4(),
        text: prompt,
        createdAt: new Date(),
        user: { _id: 1, name: 'Me' },
      };
      setMessages([initialMessage]);

      fetchChatbotResponse(convertMessagesToContents([initialMessage])).then((data) => {
        const initialResponse = {
          _id: uuidv4(),
          text: data,
          createdAt: new Date(),
          user: { _id: 2, name: 'Chatbot' },
        };
        setMessages(previousMessages => GiftedChat.append(previousMessages, [initialResponse]));
      });
    }
  }, [prompt]);

  // Send message handler
  const onSend = useCallback((messages: any[] = []) => {
    // Check if the message starts with /imagine
    if (messages[0].text.startsWith('/imagine')) {
      Alert.alert("Image", "Image is not available in this version");
      return router.replace('/');
    }
    setMessages(previousMessages => {
      const newMessages = GiftedChat.append(previousMessages, messages);

      if (messages[0].user._id === 1 && !waitingForResponse) {
        setWaitingForResponse(true);
        fetchChatbotResponse(convertMessagesToContents(newMessages)).then((data) => {
          const responseMessage = {
            _id: uuidv4(),
            text: data,
            createdAt: new Date(),
            user: { _id: 2, name: 'Chatbot' },
          };
          setMessages(previousMessages => GiftedChat.append(previousMessages, [responseMessage]));
          setWaitingForResponse(false);
        });
      }

      return newMessages;
    });
  }, [waitingForResponse]);

  // Custom input toolbar
  const customInputToolbar = (props: InputToolbarProps<IMessage>) => (
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

  // Render message text
  const renderMessageText = (props: MessageTextProps<IMessage>) => {
    const { currentMessage } = props;
    const messageText = currentMessage.text || "<p>Loading...</p>";

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
            },
            table: {
              width: '100%',
            },
            th: {
              padding: 6,
              borderBottomWidth: 1,
              borderBottomColor: '#ccc',
              textAlign: 'left',
              backgroundColor: '#f9f9f9',
            },
            td: {
              padding: 6,
              borderBottomWidth: 1,
              borderBottomColor: '#eee',
            },
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
      <MessageText {...props} />
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme ?? "light"].background }}>
      <GiftedChat
        messages={messages}
        placeholder='Message, for image start with /imagine'
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
