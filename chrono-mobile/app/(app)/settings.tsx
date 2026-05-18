import React, { useState } from 'react';
import { View, Text, StyleSheet, SectionList, Switch, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Download, Trash2, LogOut } from 'lucide-react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useTheme } from '../../src/theme';
import * as Haptics from 'expo-haptics';
import { Stack } from 'expo-router';
import { useAuth } from '../_layout';
import { Avatar } from '../../src/components/ui/Avatar';
import { Button } from '../../src/components/ui/Button';
import { SettingsRow } from '../../src/components/settings/SettingsRow';
import { ThemeMode } from '../../src/types';

export default function SettingsScreen() {
  const { colors, typography, spacing, radius, themeMode, setThemeMode } = useTheme();
  const { setIsAuthenticated } = useAuth();
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  const [webSearch, setWebSearch] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [chatSummaries, setChatSummaries] = useState(true);

  const handleClearChats = () => {
    Alert.alert('Clear All Chats', 'Are you sure you want to delete all your chat history? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => console.log('Chats cleared') },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => setIsAuthenticated(false) },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'Are you sure you want to delete your account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue', style: 'destructive', onPress: () => {
          Alert.prompt(
            'Confirm Deletion',
            'This cannot be undone. Type DELETE to confirm.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: (text?: string) => {
                if (text === 'DELETE') {
                  console.log('Account deleted');
                  setIsAuthenticated(false);
                } else {
                  Alert.alert('Error', 'Confirmation text did not match.');
                }
              }}
            ]
          );
        }
      },
    ]);
  };

  const ThemeSegmentedControl = () => {
    const modes: { label: string; value: ThemeMode }[] = [
      { label: 'Light', value: 'light' },
      { label: 'System', value: 'system' },
      { label: 'Dark', value: 'dark' },
    ];

    return (
      <View style={[styles.segmentedControl, { backgroundColor: colors.surfaceElevated, borderRadius: radius.md, padding: spacing.xs }]}>
        {modes.map((mode) => {
          const isActive = themeMode === mode.value;
          return (
            <TouchableOpacity
              key={mode.value}
              style={[
                styles.segment,
                {
                  backgroundColor: isActive ? colors.accent : 'transparent',
                  borderRadius: radius.sm - 2,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setThemeMode(mode.value);
              }}
            >
              <Text style={{ color: isActive ? colors.accentForeground : colors.text, fontSize: typography.size.sm, fontWeight: isActive ? '600' : '400' }}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const sections = [
    {
      title: '',
      data: [{ type: 'profile' }],
    },
    {
      title: 'Appearance',
      data: [
        { type: 'theme' },
      ],
    },
    {
      title: 'AI Preferences',
      data: [
        { type: 'row', label: 'Default Model', value: 'Gemini 1.5 Pro', onPress: () => {} },
        { type: 'row', label: 'Response Language', value: 'English', onPress: () => {} },
        { type: 'row', label: 'Web Search', rightElement: <Switch value={webSearch} onValueChange={setWebSearch} trackColor={{ true: colors.accent }} /> },
      ],
    },
    {
      title: 'Notifications',
      data: [
        { type: 'row', label: 'Push Notifications', rightElement: <Switch value={pushNotifications} onValueChange={setPushNotifications} trackColor={{ true: colors.accent }} /> },
        { type: 'row', label: 'Chat Summaries', rightElement: <Switch value={chatSummaries} onValueChange={setChatSummaries} trackColor={{ true: colors.accent }} /> },
      ],
    },
    {
      title: 'Data & Privacy',
      data: [
        { type: 'row', label: 'Export Chat History', icon: Download, onPress: () => {} },
        { type: 'row', label: 'Clear All Chats', icon: Trash2, destructive: true, onPress: handleClearChats, hideChevron: true },
      ],
    },
    {
      title: 'Account',
      data: [
        { type: 'row', label: 'Change Password', onPress: () => {} },
        { type: 'row', label: 'Sign Out', icon: LogOut, destructive: true, onPress: handleSignOut },
      ],
    },
    {
      title: 'Danger Zone',
      isDanger: true,
      data: [{ type: 'dangerButton' }],
    },
  ];

  const renderItem = ({ item }: any) => {
    if (item.type === 'profile') {
      return (
        <View style={[styles.profileSection, { paddingVertical: spacing.xl }]}>
          <Avatar uri="https://i.pravatar.cc/150?u=a042581f4e29026704d" size={80} />
          <Text style={[styles.profileName, { color: colors.text, fontSize: typography.size.xl, marginTop: spacing.md }]}>John Doe</Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted, fontSize: typography.size.sm, marginBottom: spacing.lg }]}>john.doe@example.com</Text>
          <Button variant="secondary" size="sm" label="Edit Profile" />
        </View>
      );
    }

    if (item.type === 'theme') {
      return (
        <View style={[styles.themeRow, { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomColor: colors.borderSubtle }]}>
          <Text style={{ color: colors.text, fontSize: typography.size.base }}>Theme</Text>
          <ThemeSegmentedControl />
        </View>
      );
    }

    if (item.type === 'dangerButton') {
      return (
        <View style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md }}>
          <Button variant="danger" label="Delete Account" onPress={handleDeleteAccount} fullWidth />
        </View>
      );
    }

    return (
      <SettingsRow
        label={item.label}
        value={item.value}
        icon={item.icon}
        destructive={item.destructive}
        onPress={item.onPress}
        rightElement={item.hideChevron ? <View /> : item.rightElement}
      />
    );
  };

  const renderSectionHeader = ({ section }: any) => {
    if (!section.title) return null;
    return (
      <Text style={[
        styles.sectionHeader,
        {
          color: section.isDanger ? colors.danger : colors.textMuted,
          fontSize: typography.size.sm,
          paddingHorizontal: spacing.lg,
          paddingTop: spacing.xl,
          paddingBottom: spacing.sm,
          backgroundColor: colors.background,
        }
      ]}>
        {section.title.toUpperCase()}
      </Text>
    );
  };

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(200)} style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerLargeTitle: true, title: 'Settings' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.type + index}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: spacing.xxxl }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
  },
  profileName: {
    fontWeight: 'bold',
  },
  profileEmail: {
    marginBottom: 16,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segmentedControl: {
    flexDirection: 'row',
    width: 200,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  sectionHeader: {
    fontWeight: '600',
  },
});
