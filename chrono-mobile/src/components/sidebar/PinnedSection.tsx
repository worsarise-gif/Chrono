import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Bookmark } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { MockChat } from '../../types';
import { ChatListItem } from './ChatListItem';

type PinnedSectionProps = {
  chats: MockChat[];
  activeChatId?: string;
  onChatPress: (id: string) => void;
};

export const PinnedSection: React.FC<PinnedSectionProps> = ({ chats, activeChatId, onChatPress }) => {
  const { colors, typography, spacing } = useTheme();

  if (chats.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
        <Bookmark color={colors.textMuted} size={14} style={{ marginRight: spacing.sm }} />
        <Text style={{ color: colors.textMuted, fontSize: typography.size.sm }}>Pinned</Text>
      </View>
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onPress={() => onChatPress(chat.id)}
          onPin={() => {
            // Mock: in a real app this would call an API or update state
          }}
          onRename={() => {
            // Mock: in a real app this would open a rename modal
          }}
          onDelete={() => {
            // Mock: in a real app this would show a confirmation modal and delete
          }}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
});
