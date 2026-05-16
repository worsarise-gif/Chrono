import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../theme';
import { LucideIcon } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  label,
  onPress,
  loading = false,
  disabled = false,
  icon: Icon,
  fullWidth = false,
}: ButtonProps) {
  const { colors, typography, radius, spacing } = useTheme();
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

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.accent;
      case 'secondary': return colors.surfaceElevated;
      case 'danger': return colors.danger;
      case 'ghost': return 'transparent';
      default: return colors.accent;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return colors.accentForeground;
      case 'secondary': return colors.text;
      case 'danger': return colors.accentForeground;
      case 'ghost': return colors.text;
      default: return colors.accentForeground;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm': return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case 'md': return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
      case 'lg': return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl };
      default: return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.4 : 1,
    width: fullWidth ? '100%' : undefined,
    ...getPadding(),
  };

  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium,
    marginLeft: Icon ? spacing.sm : 0,
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[containerStyle, animatedStyle]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
          {Icon && <Icon size={typography.size.base} color={getTextColor()} />}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}
