import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import Animated, { FadeIn, FadeInUp, useReducedMotion, withRepeat, withTiming, Easing, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Atom, Code, Calculator, Image as ImageIcon, PanelLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme';
import { ChronoLogo } from '../../src/components/auth/ChronoLogo';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { IconButton } from '../../src/components/ui/IconButton';
import * as Haptics from 'expo-haptics';

const CHIPS = [
  { label: 'Explain quantum computing', icon: Atom },
  { label: 'Write a Python web scraper', icon: Code },
  { label: 'Solve this equation: x² + 5x + 6 = 0', icon: Calculator },
  { label: 'Summarize an image I upload', icon: ImageIcon },
];

const AnimatedChip = ({ label, icon: Icon, index, onPress }: any) => {
  const { colors, typography, radius, spacing } = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (!reducedMotion) scale.value = withSpring(0.95);
  };
  const handlePressOut = () => {
    if (!reducedMotion) scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const entering = reducedMotion ? undefined : FadeInUp.delay(index * 60).springify();

  return (
    <Animated.View entering={entering} style={[styles.chipWrapper, animatedStyle]}>
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: radius.xl,
            padding: spacing.md,
          },
        ]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={reducedMotion ? 0.7 : 1}
      >
        <Icon size={18} color={colors.text} style={{ marginBottom: spacing.xs }} />
        <Text style={{ color: colors.text, fontSize: typography.size.sm, fontWeight: typography.weight.medium as any }}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function IndexScreen() {
  const { colors, typography, spacing } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    if (!reducedMotion) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 8000, easing: Easing.linear }),
        -1
      );
    }
  }, [reducedMotion]);

  const animatedLogoStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const handleSend = (text: string, imageUri?: string) => {
    // In a real app, we'd save this to global state or DB before navigating
    // For now, mock navigating to a new chat
    const chatId = `new-chat-${Date.now()}`;
    router.push(`/chat/${chatId}`);
  };

  const handleChipPress = (text: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSend(text);
  };

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(200)} style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <IconButton
          icon={PanelLeft as any}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel="Open drawer"
        />
      </View>

      {/* Main Content */}
      <View style={[styles.content, { paddingHorizontal: spacing.lg }]}>
        <View style={styles.heroContainer}>
          <Animated.View style={animatedLogoStyle}>
            <ChronoLogo size="lg" />
          </Animated.View>

          <Text style={[styles.heading, { color: colors.text, fontSize: typography.size.xl, fontWeight: typography.weight.bold as any, marginTop: spacing.xl }]}>
            How can I help you today?
          </Text>
          <Text style={[styles.subheading, { color: colors.textMuted, fontSize: typography.size.sm, marginTop: spacing.sm }]}>
            Ask me anything.
          </Text>
        </View>

        <View style={[styles.chipGrid, { marginTop: spacing.xxl }]}>
          {CHIPS.map((chip, index) => (
            <AnimatedChip
              key={index}
              label={chip.label}
              icon={chip.icon}
              index={index}
              onPress={() => handleChipPress(chip.label)}
            />
          ))}
        </View>
      </View>

      {/* Input area */}
      <ChatInput onSend={handleSend} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  heroContainer: {
    alignItems: 'center',
  },
  heading: {
    textAlign: 'center',
  },
  subheading: {
    textAlign: 'center',
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  chipWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  chip: {
    borderWidth: 1,
    height: 100,
    justifyContent: 'space-between',
  },
});
