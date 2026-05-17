import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, useReducedMotion } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';

type SkeletonProps = {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width, height, borderRadius, style }: SkeletonProps) {
  const { colors, radius, isDark } = useTheme();
  const translateX = useSharedValue(-100);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!reducedMotion) {
      translateX.value = withRepeat(
        withTiming(100, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        false
      );
    }
  }, [translateX, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: `${translateX.value}%` }],
    };
  });

  const baseColor = colors.surfaceElevated;
  const highlightColor = colors.borderSubtle;
  const transparentColor = isDark ? 'rgba(0,0,0,0)' : 'rgba(255,255,255,0)';

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: baseColor,
          borderRadius: borderRadius ?? radius.sm,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {!reducedMotion && (
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <LinearGradient
            colors={[transparentColor, highlightColor, transparentColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}
