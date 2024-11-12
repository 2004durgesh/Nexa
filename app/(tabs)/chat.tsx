import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import { Content, Message, Role, Part } from '@/constants/types';
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
  return messages.map(message => {
    const part: Part = {};
    if (message.text) {
      part.text = message.text;
    } else if (message.inlineData) {
      part.inlineData = message.inlineData;
    }
    return {
      role: message.user._id === 1 ? Role.user : Role.model,
      parts: [part],
    };
  }).reverse();
};

const convertContentsToMessages = (contents: Content[]): Message[] => {
  return contents.reverse().map((content, index) => {
    const message: Message = {
      _id: index,
      text: content.parts[0].text || '',
      createdAt: new Date(),
      user: { _id: content.role === Role.user ? 1 : 2, name: content.role === Role.user ? 'Me' : 'Chatbot' },
    };

    if (content.parts[0].inlineData) {
      const { mimeType, data } = content.parts[0].inlineData;
      message.image = `data:${mimeType};base64,${data}`;
    }

    return message;
  });
};

// Main component
export default function Chat() {
  const { prompt, sessionId: initialSessionId } = useLocalSearchParams() as { prompt: string, sessionId: string };
  const [sessionId, setSessionId] = useState<string>(initialSessionId || uuidv4());
  const [messages, setMessages] = useState<Message[]>([]);
  const [contents, setContents] = useState<Content[]>([]);
  const codeBlocksRef = useRef<Map<string, string>>(new Map());
  const [renderers, setRenderers] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const { colorScheme } = useScheme() ;
  const { width } = useWindowDimensions();
  const router = useRouter();
  useEffect(() => {
    setSessionId(initialSessionId);
  }, [initialSessionId]);
  // Markdown rendering configuration
  const md = markdownit({
    highlight: (str: string, lang: string): string => {
      const codeKey = uuidv4(); // Generate a unique key for each code block
      codeBlocksRef.current.set(codeKey, str); // Store the code block in the ref
      console.log("Code blocks:", codeBlocksRef.current);
      if (lang && hljs.getLanguage(lang)) {
        try {
          return `<pre data-code="${codeKey}"><div style='display:flex;flex-direction:row;justify-content:space-between'><p>${lang}</p></div><code class="hljs language-${lang}">` +
            hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
            '</code></pre>';
        } catch (err) {
          console.error(err);
        }
      }
      return `<pre data-code="${codeKey}"><code class="hljs">${md.utils.escapeHtml(str)}</code></pre>`;
    }
  });

  // Effect to set up custom block renderer
  useEffect(() => {
    const PreRenderer: CustomBlockRenderer = function PreRenderer({ TDefaultRenderer, ...props }) {
      const handlePress = () => {
        const codeKey = props.tnode.attributes['data-code'];
        const code = codeBlocksRef.current.get(codeKey);
        console.log("Code block pressed:", codeKey, code);
        if (code) {
          handleCopyCode(code);
        }
      };
      return <TDefaultRenderer {...props} onPress={handlePress} />;
    };
    setRenderers({ pre: PreRenderer });
  }, []);

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

  //Fetch image generation
  const fetchImageGeneration = async (prompt: string) => {
    console.log(prompt);
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL!}/images/fal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "prompt": prompt, "model": "stableDiffusionXL" }),
      });

      const data = await response.json();
      const imageUrl = data.image;
      console.log(imageUrl);
      const imageResponse = await fetch(imageUrl);
      const blob = await imageResponse.blob();
      const mimeType = "image/jpeg";
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract the base64 string part after the comma
          const base64String = result.split(',')[1]?.replace(/\s+/g, ''); // Remove any line breaks
          if (base64String) {
            resolve(base64String); // Return only the base64 part
          } else {
            reject(new Error("Failed to extract base64 string."));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob); // Read the Blob or file
      });


      return { mimeType, base64, imageUrl }
    } catch (error: any) {
      console.log('Error fetching image generation:', error.message);
      setIsLoading(false);
    }
  }
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
      console.log(data);
      if (data.error) {
        if (data.error.code === 500) {
          return data.error.message
        }
        else {
          return "I'm sorry, I don't have an answer for that."
        }
      }
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
    setMessages(previousMessages => {
      const newMessages = GiftedChat.append(previousMessages, messages);

      if (messages[0].text.startsWith('/imagine')) {
        const prompt = messages[0].text.replace('/imagine', '').trim();
        fetchImageGeneration(prompt).then((result) => {
          if (result) {
            const { mimeType, base64, imageUrl } = result;
            if (imageUrl) {
              const imageMessage = {
                _id: uuidv4(),
                text: '',
                image: imageUrl,
                createdAt: new Date(),
                user: { _id: 2, name: 'Chatbot' },
                inlineData: { "mimeType": String(mimeType), "data": String(base64) },
              };
              setMessages(previousMessages => GiftedChat.append(previousMessages, [imageMessage]));
            }
          }
        });
      } else if (messages[0].user._id === 1 && !waitingForResponse) {
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
        borderTopColor: "#000",
        borderColor: "#000",
        borderWidth: 1,
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
      <ThemedView invert className='p-4 shrink-[1]'>
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
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors[colorScheme].background }}>
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
        onLongPress={(context, message) => {
          if (message.text) {
            handleCopyCode(message.text);
          }
        }}
      />
    </SafeAreaView>
  );
}
