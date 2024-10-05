import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { ThemedText } from '@/components/ThemedText';
import React from 'react';

export function HelloWave() {
  const rotationAnimation = useSharedValue(0);

  const startAnimation = () => {
    rotationAnimation.value = withRepeat(
      withSequence(withTiming(25, { duration: 150 }), withTiming(0, { duration: 150 })),
      4, // Run the animation 4 times
      false // Do not reverse the animation
    );
  };

useFocusEffect(
  useCallback(() => {
    startAnimation();
    return () => {
      rotationAnimation.value = 0;
    };
  }, [])
);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotationAnimation.value}deg` }],
  }));

  return (
    <TouchableOpacity onPress={startAnimation}>
      <Animated.View style={animatedStyle}>
        <ThemedText style={styles.text}>👋</ThemedText>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 24,
    lineHeight: 32,
    marginTop: -6,
  },
});