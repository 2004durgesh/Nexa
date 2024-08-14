import { Image, StyleSheet, Button, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useAuth } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import ExploreContent from '@/constants/ExploreContent.json';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface ExploreItem {
  id: string;
  category: string;
  bgColor: string;
  title: string;
  prompt: string;
  image: string;
}

const imageMapping: { [key: string]: any } = {
  '@/assets/images/explore-images/code-square.png': require('@/assets/images/explore-images/code-square.png'),
  '@/assets/images/explore-images/chat-square-code.png': require('@/assets/images/explore-images/chat-square-code.png'),
  '@/assets/images/explore-images/pen-new-square.png': require('@/assets/images/explore-images/pen-new-square.png'),
  '@/assets/images/explore-images/language-square.png': require('@/assets/images/explore-images/language-square.png'),
  '@/assets/images/explore-images/light-bulb.png': require('@/assets/images/explore-images/light-bulb.png'),
  '@/assets/images/explore-images/graph-up.png': require('@/assets/images/explore-images/graph-up.png'),
  '@/assets/images/explore-images/notebook-minimalistic.png': require('@/assets/images/explore-images/notebook-minimalistic.png'),
  '@/assets/images/explore-images/music-notes.png': require('@/assets/images/explore-images/music-notes.png'),
  '@/assets/images/explore-images/smile-square.png': require('@/assets/images/explore-images/smile-square.png'),
  '@/assets/images/explore-images/emoji-funny-square.png': require('@/assets/images/explore-images/emoji-funny-square.png'),
};
export default function HomeScreen() {
  const { signOut } = useAuth();
  const router = useRouter()
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/nexa.png')}
          style={styles.nexaLogo}
        />
      }>

      <Button title="Sign Out" onPress={() => signOut()} />
      <View className='flex flex-col'>
        {Object.keys(ExploreContent).map((category) => (
          <View key={category} className='mb-4'>
            <ThemedText type="title" className='pt-4 px-4' style={{ fontSize: 24 }}>{category}</ThemedText>
            <View className='flex flex-row flex-wrap'>
              {ExploreContent[category as keyof typeof ExploreContent].map((item: ExploreItem) => (
                <ThemedView className='w-1/2 p-4' key={item.id}>
                  <TouchableOpacity onPress={()=> router.replace(`/explore?prompt=${item.prompt}`)}>
                    <View className='border border-white p-4 rounded-xl'>
                      <View className='w-10 h-10 justify-center items-center rounded-md'
                        style={{ backgroundColor: item.bgColor }}
                      >
                        <Image
                          style={{ width: 25, height: 25 }}
                          source={imageMapping[item.image]}
                          resizeMode='contain'
                        />
                      </View>
                      <ThemedView>
                          <ThemedText type="subtitle" className='mt-4 mb-2' style={{ fontSize: 18 }}>{item.title}</ThemedText>
                        <ThemedText numberOfLines={3} style={{ fontSize: 14, lineHeight: 16, letterSpacing: 0.5 }}>{item.prompt}</ThemedText>
                      </ThemedView>
                    </View>
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  nexaLogo: {
    height: 294,
    width: 275,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
