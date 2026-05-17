import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { PanelLeft, MoreHorizontal, ChevronDown, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../src/theme';
import { MOCK_MESSAGES, MockMessage } from '../../../src/mock/messages';
import { MOCK_CHATS } from '../../../src/mock/chats';
import { MessageList } from '../../../src/components/chat/MessageList';
import { ChatInput } from '../../../src/components/chat/ChatInput';
import { IconButton } from '../../../src/components/ui/IconButton';
import { Badge } from '../../../src/components/ui/Badge';

const MODELS = [
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { id: 'gemini-flash', label: 'Gemini Flash' },
  { id: 'llama-3', label: 'Groq Llama 3' },
  { id: 'cerebras', label: 'Cerebras' },
];

export default function ChatScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const chatId = id || 'chat-1';
  const chatInfo = MOCK_CHATS.find((c) => c.id === chatId);

  const [messages, setMessages] = useState<MockMessage[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODELS[0]);
  const [isModelModalVisible, setIsModelModalVisible] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [titleValue, setTitleValue] = useState(chatInfo?.title || 'New Chat');

  // Set initial messages based on ID
  useEffect(() => {
    const initialMessages = MOCK_MESSAGES[chatId] || MOCK_MESSAGES['chat-1'] || [];
    setMessages(initialMessages);
    setTitleValue(chatInfo?.title || 'New Chat');
  }, [chatId]);

  const handleSend = (text: string, imageUri?: string) => {
    if (text === '__STOP__') {
      // Handle stop streaming logic (simplified for mock)
      setMessages((prev) => {
        const newMsgs = [...prev];
        const lastMsg = newMsgs[newMsgs.length - 1];
        if (lastMsg && lastMsg.isStreaming) {
          lastMsg.isStreaming = false;
        }
        return newMsgs;
      });
      return;
    }

    const newUserMsg: MockMessage = {
      id: `msg-${Date.now()}`,
      chatId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
      messageType: 'text',
      hasImage: !!imageUri,
      imageUrl: imageUri,
    };

    setMessages((prev) => [...prev, newUserMsg]);

    // Simulate network delay and streaming
    setTimeout(() => {
      const streamingMsgId = `msg-${Date.now() + 1}`;
      const streamingMsg: MockMessage = {
        id: streamingMsgId,
        chatId,
        role: 'model',
        content: '',
        createdAt: new Date().toISOString(),
        messageType: 'text',
        isStreaming: true,
      };

      setMessages((prev) => [...prev, streamingMsg]);

      setTimeout(() => {
        setMessages((prev) => {
          return prev.map((msg) => {
            if (msg.id === streamingMsgId) {
              return {
                ...msg,
                isStreaming: false,
                content: "Thanks for your message! Here's my response. This is a mock response rendered in full Markdown.\n\n```javascript\nconsole.log('hello');\n```\n\nThis is `inline code`.",
              };
            }
            return msg;
          });
        });
      }, 2000);
    }, 500);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <IconButton
          icon={PanelLeft as any}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel="Open sidebar"
        />

        <View style={styles.titleContainer}>
          {isRenaming ? (
            <TextInput
              style={[styles.titleInput, { color: colors.text, fontSize: typography.size.base }]}
              value={titleValue}
              onChangeText={setTitleValue}
              onBlur={() => setIsRenaming(false)}
              onSubmitEditing={() => setIsRenaming(false)}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setIsRenaming(true)} style={styles.titleTouchable}>
              <Text style={[styles.title, { color: colors.text, fontSize: typography.size.base }]} numberOfLines={1}>
                {titleValue}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.modelPill, { backgroundColor: colors.surfaceElevated, borderRadius: radius.full }]}
            onPress={() => setIsModelModalVisible(true)}
          >
            <Text style={{ color: colors.text, fontSize: typography.size.xs, fontWeight: '500', marginRight: 4 }}>
              {selectedModel.label}
            </Text>
            <ChevronDown color={colors.text} size={14} />
          </TouchableOpacity>
          <IconButton icon={MoreHorizontal as any} onPress={() => {}} accessibilityLabel="More options" />
        </View>
      </View>

      {/* Body */}
      <View style={styles.body}>
        <MessageList messages={messages} onRefresh={handleRefresh} refreshing={isRefreshing} />
      </View>

      {/* Footer */}
      <ChatInput
        onSend={handleSend}
        isStreaming={messages.length > 0 && messages[messages.length - 1].isStreaming}
      />

      {/* Model Selector Modal */}
      <Modal visible={isModelModalVisible} transparent animationType="slide">
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setIsModelModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
            <Text style={[styles.modalTitle, { color: colors.text, fontSize: typography.size.lg }]}>Select Model</Text>
            {MODELS.map((model) => (
              <TouchableOpacity
                key={model.id}
                style={[styles.modelOption, { borderBottomColor: colors.borderSubtle }]}
                onPress={() => {
                  setSelectedModel(model);
                  setIsModelModalVisible(false);
                }}
              >
                <Text style={{ color: colors.text, fontSize: typography.size.base, fontWeight: selectedModel.id === model.id ? '600' : '400' }}>
                  {model.label}
                </Text>
                {selectedModel.id === model.id && <Check color={colors.accent} size={20} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  titleTouchable: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  titleInput: {
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    padding: 0,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  body: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modelOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
