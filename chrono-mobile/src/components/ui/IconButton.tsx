import React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { LucideIcon } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  size?: number;
  color?: string;
  accessibilityLabel: string;
};

export function IconButton({ icon: Icon, onPress, size = 24, color, accessibilityLabel }: IconButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const handlePressIn = () => {
    if (!reducedMotion) {
      scale.value = withSpring(0.96);
    }
  };

  const handlePressOut = () => {
    if (!reducedMotion) {
      scale.value = withSpring(1);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const iconColor = color || colors.text;

  // Enforce minimum touch target 44x44
  const containerStyle: ViewStyle = {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[containerStyle, animatedStyle]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
    >
      <Icon size={size} color={iconColor} />
    </AnimatedPressable>
  );
}
