import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { useTheme } from '../../theme';

const DOT_SIZE = 6;
const BOUNCE_HEIGHT = -6;

export function TypingDots() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Dot index={0} color={colors.textMuted} />
      <Dot index={1} color={colors.textMuted} />
      <Dot index={2} color={colors.textMuted} />
    </View>
  );
}

function Dot({ index, color }: { index: number; color: string }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 150,
      withRepeat(
        withSequence(
          withTiming(BOUNCE_HEIGHT, { duration: 300 }),
          withTiming(0, { duration: 300 }),
          withTiming(0, { duration: 600 }) // pause before next bounce
        ),
        -1,
        false
      )
    );
  }, [index, translateY]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 12,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
});
