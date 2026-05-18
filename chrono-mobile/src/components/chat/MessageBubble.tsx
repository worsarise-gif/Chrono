import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, Modal, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { Copy, Share, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../theme';
import { MockMessage } from '../../types';
import { ImageMessage } from './ImageMessage';
import { MarkdownMessage } from './MarkdownMessage';
import { StreamingText } from './StreamingText';

// Placeholder for an actual Logo SVG component if needed
const ChronoLogo = ({ size, color }: { size: number; color: string }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: size / 2 }} />
);

type MessageBubbleProps = {
  message: MockMessage;
  index: number;
};

export const MessageBubble: React.FC<MessageBubbleProps> = React.memo(({ message, index }) => {
  const { colors, typography, spacing, radius } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  const isUser = message.role === 'user';

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.content);
    setModalVisible(false);
    Toast.show({ type: 'info', text1: 'Message copied' });
  };

  const handleShare = async () => {
    setModalVisible(false);
    if (!(await Sharing.isAvailableAsync())) {
      Toast.show({ type: 'error', text1: 'Sharing is not available' });
      return;
    }
    await Sharing.shareAsync(message.content || message.imageUrl || '');
  };

  const handleDelete = () => {
    setModalVisible(false);
    Toast.show({ type: 'info', text1: 'Message deleted' });
  };

  const delay = Math.min(index * 30, 300);

  return (
    <Animated.View
      entering={reducedMotion ? undefined : FadeInDown.delay(delay).duration(250).springify()}
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.modelContainer,
      ]}
    >
      {!isUser && (
        <View style={styles.modelHeader}>
          <ChronoLogo size={12} color={colors.accent} />
          <Text style={[styles.modelLabel, { color: colors.textMuted, fontSize: typography.size.xs }]}>
            Chrono
          </Text>
        </View>
      )}

      <TouchableWithoutFeedback onLongPress={handleLongPress} delayLongPress={400}>
        <View style={{ width: '100%', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
          {message.hasImage && message.imageUrl && (
            <View style={{ width: isUser ? '80%' : '100%', marginBottom: message.content ? spacing.sm : 0 }}>
              <ImageMessage uri={message.imageUrl} isGenerated={message.isGeneratedImage} />
            </View>
          )}

          {message.content ? (
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: isUser ? colors.userBubble : colors.assistantBubble,
                  paddingHorizontal: isUser ? spacing.md : 0,
                  paddingVertical: isUser ? spacing.sm : 0,
                  borderRadius: radius.xl,
                  borderBottomRightRadius: isUser ? radius.sm : radius.xl,
                  maxWidth: isUser ? '80%' : '100%',
                },
              ]}
            >
              {isUser ? (
                <Text style={{ color: colors.text, fontSize: typography.size.base }}>
                  {message.content}
                </Text>
              ) : message.isStreaming ? (
                <StreamingText text={message.content} isStreaming={true} />
              ) : (
                <MarkdownMessage content={message.content} />
              )}
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>

      <Text
        style={[
          styles.timestamp,
          {
            color: colors.textMuted,
            fontSize: typography.size.xs,
            alignSelf: isUser ? 'flex-end' : 'flex-start',
            marginTop: spacing.xs,
          },
        ]}
      >
        {format(new Date(message.createdAt), 'h:mm a')}
      </Text>

      <Modal visible={modalVisible} transparent={true} animationType="slide">
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }]}>
            <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />

            <TouchableOpacity style={styles.modalOption} onPress={handleCopy}>
              <Copy color={colors.text} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text, fontSize: typography.size.base }]}>Copy Text</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleShare}>
              <Share color={colors.text} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.text, fontSize: typography.size.base }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleDelete}>
              <Trash2 color={colors.danger} size={20} />
              <Text style={[styles.modalOptionText, { color: colors.danger, fontSize: typography.size.base }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
});

MessageBubble.displayName = 'MessageBubble';

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    width: '100%',
  },
  userContainer: {
    alignItems: 'flex-end',
  },
  modelContainer: {
    alignItems: 'flex-start',
    paddingLeft: 20,
  },
  modelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  modelLabel: {
    marginLeft: 6,
    fontWeight: '500',
  },
  bubble: {
    overflow: 'hidden',
  },
  timestamp: {
    marginTop: 4,
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
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  modalOptionText: {
    marginLeft: 12,
    fontWeight: '500',
  },
});