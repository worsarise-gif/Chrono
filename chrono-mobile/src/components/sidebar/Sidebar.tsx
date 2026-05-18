import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Settings } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { MOCK_CHATS, MockChat } from '../../mock/chats';
import { NewChatButton } from './NewChatButton';
import { PinnedSection } from './PinnedSection';
import { ChatListItem } from './ChatListItem';
import { Divider } from '../ui/Divider';
import { Avatar } from '../ui/Avatar';
import { IconButton } from '../ui/IconButton';

// Placeholder Logo
const ChronoLogo = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
);

export const Sidebar: React.FC = () => {
  const { colors, typography, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();

  const pinnedChats = MOCK_CHATS.filter((c) => c.isPinned);
  const recentChats = MOCK_CHATS.filter((c) => !c.isPinned);

  const handleChatPress = (id: string) => {
    navigation.dispatch(DrawerActions.closeDrawer());
    router.push(`/chat/${id}` as any);
  };

  const renderRecentChat = ({ item }: { item: MockChat }) => (
    <ChatListItem
      chat={item}
      onPress={() => handleChatPress(item.id)}
      onPin={() => {
        // Mock: in a real app this would pin the chat
      }}
      onRename={() => {
        // Mock: in a real app this would open a rename modal
      }}
      onDelete={() => {
        // Mock: in a real app this would delete the chat
      }}
    />
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.sidebarBackground,
          borderRightColor: colors.sidebarBorder,
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, spacing.md),
        },
      ]}
    >
      <View style={[styles.header, { padding: spacing.lg }]}>
        <ChronoLogo size={24} color={colors.accent} />
        <Text style={[styles.brandText, { color: colors.text, fontSize: typography.size.lg }]}>
          Chrono
        </Text>
      </View>

      <NewChatButton onPress={() => console.log('New Chat')} />

      <View style={{ height: spacing.md }} />

      {pinnedChats.length > 0 && (
        <>
          <PinnedSection chats={pinnedChats} onChatPress={handleChatPress} />
          <Divider />
        </>
      )}

      <Text
        style={[
          styles.sectionLabel,
          { color: colors.textMuted, fontSize: typography.size.sm, paddingHorizontal: spacing.lg },
        ]}
      >
        Recent
      </Text>

      <View style={styles.listContainer}>
        <FlashList
          data={recentChats}
          keyExtractor={(item) => item.id}
          renderItem={renderRecentChat}
          // @ts-ignore
          estimatedItemSize={56}
        />
      </View>

      <Divider />

      <View style={[styles.userRow, { paddingHorizontal: spacing.lg, paddingTop: spacing.md }]}>
        <Avatar uri="https://i.pravatar.cc/150?u=a042581f4e29026704d" initials="JD" size={36} />
        <View style={styles.userInfo}>
          <Text style={{ color: colors.text, fontSize: typography.size.base, fontWeight: typography.weight.medium as any }}>
            John Doe
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.size.xs }}>
            john.doe@example.com
          </Text>
        </View>
        <IconButton
          icon={Settings as any}
          onPress={() => router.push('/settings')}
          accessibilityLabel="Settings"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRightWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    marginLeft: 12,
    fontWeight: 'bold',
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
});
