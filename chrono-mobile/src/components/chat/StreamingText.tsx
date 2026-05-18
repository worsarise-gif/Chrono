import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming, useSharedValue } from 'react-native-reanimated';
import { useStreamingText } from '../../hooks/useStreamingText';
import { useTheme } from '../../theme';
import { MarkdownMessage } from './MarkdownMessage';
import { TypingDots } from '../ui/TypingDots';

type StreamingTextProps = {
  text: string;
  isStreaming: boolean;
};

export const StreamingText: React.FC<StreamingTextProps> = React.memo(({ text, isStreaming }) => {
  const displayText = useStreamingText(text, isStreaming);
  const { colors, typography } = useTheme();

  const cursorOpacity = useSharedValue(1);

  React.useEffect(() => {
    if (isStreaming) {
      cursorOpacity.value = withRepeat(
        withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
        true
      );
    } else {
      cursorOpacity.value = 1;
    }
  }, [isStreaming, cursorOpacity]);

  const animatedCursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  if (!isStreaming) {
    return <MarkdownMessage content={text} />;
  }

  if (isStreaming && !text) {
    return (
      <View style={[styles.container, { paddingVertical: 8 }]}>
        <TypingDots />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={{ color: colors.text, fontSize: typography.size.base, lineHeight: typography.lineHeight.relaxed }}>
        {displayText}
        {isStreaming && (
          <Animated.Text style={[animatedCursorStyle, { color: colors.text }]}>
            ▌
          </Animated.Text>
        )}
      </Text>
    </View>
  );
});

StreamingText.displayName = 'StreamingText';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});