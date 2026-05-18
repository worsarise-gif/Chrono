import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ArrowDown } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { MockMessage } from '../../mock/messages';
import { MessageBubble } from './MessageBubble';
import { Skeleton } from '../ui/Skeleton';

type MessageListProps = {
  messages: MockMessage[];
  isLoading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export const MessageList: React.FC<MessageListProps> = ({ messages, isLoading = false, onRefresh, refreshing = false }) => {
  const { colors, spacing, radius } = useTheme();
  const listRef = useRef<any>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleScroll = (event: any) => {
    // Inverted list: scrollY > 0 means scrolled up
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollButton(offsetY > 200);
  };

  const scrollToBottom = () => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  React.useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingHorizontal: spacing.lg, paddingTop: spacing.xl }]}>
        <View style={{ alignItems: 'flex-start', marginBottom: spacing.lg }}>
          <Skeleton width="80%" height={80} borderRadius={radius.xl} />
        </View>
        <View style={{ alignItems: 'flex-end', marginBottom: spacing.lg }}>
          <Skeleton width="60%" height={60} borderRadius={radius.xl} />
        </View>
        <View style={{ alignItems: 'flex-start', marginBottom: spacing.lg }}>
          <Skeleton width="90%" height={100} borderRadius={radius.xl} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        ref={listRef}
        data={[...messages].reverse()} // Reverse for inverted list
        // @ts-ignore
        inverted={true}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <MessageBubble message={item} index={index} />}
        estimatedItemSize={80}
        ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.xl,
        }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {showScrollButton && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.scrollButtonContainer}>
          <TouchableOpacity
            style={[
              styles.scrollButton,
              { backgroundColor: colors.accent, borderRadius: radius.full, shadowColor: colors.text },
            ]}
            onPress={scrollToBottom}
          >
            <ArrowDown color={colors.accentForeground} size={20} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollButtonContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
  },
  scrollButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});