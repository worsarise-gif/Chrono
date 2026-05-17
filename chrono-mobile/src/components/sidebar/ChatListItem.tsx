import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { MessageSquare, Bookmark, Pencil, Trash2 } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { useTheme } from '../../theme';
import { MockChat } from '../../mock/chats';

type ChatListItemProps = {
  chat: MockChat;
  isActive?: boolean;
  onPress: () => void;
  onPin: () => void;
  onRename: () => void;
  onDelete: () => void;
};

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(({ chat, isActive, onPress, onPin, onRename, onDelete }) => {
  const { colors, typography, spacing, radius } = useTheme();

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    return (
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={onPin}>
          <Bookmark color={colors.accentForeground} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.textMuted }]} onPress={onRename}>
          <Pencil color={colors.background} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.danger }]} onPress={onDelete}>
          <Trash2 color={colors.accentForeground} size={20} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions} friction={2} rightThreshold={40}>
      <TouchableOpacity
        onPress={onPress}
        style={[
          styles.container,
          {
            backgroundColor: isActive ? colors.accentDim : 'transparent',
            borderLeftColor: isActive ? colors.accent : 'transparent',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.md,
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <MessageSquare color={colors.textMuted} size={18} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: colors.text, fontSize: typography.size.base }]} numberOfLines={1}>
            {chat.title}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: colors.textSubtle, fontSize: typography.size.xs }]}>
          {formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: false }).replace('about ', '')}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
});

ChatListItem.displayName = 'ChatListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
  },
  iconContainer: {
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: '500',
  },
  timestamp: {
    minWidth: 40,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
