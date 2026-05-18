import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { ImagePlus, ArrowUp, Square, X } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

type ChatInputProps = {
  onSend: (text: string, imageUri?: string) => void;
  isStreaming?: boolean;
  disabled?: boolean;
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSend, isStreaming = false, disabled = false }) => {
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>();
  const { colors, typography, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSend = () => {
    if (isStreaming) {
      onSend('__STOP__');
      return;
    }

    if (text.trim().length === 0 && !imageUri) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(text, imageUri);
    setText('');
    setImageUri(undefined);
  };

  const canSend = text.trim().length > 0 || imageUri !== undefined;

  return (
    <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderSubtle,
            paddingBottom: Math.max(insets.bottom, spacing.md),
            paddingTop: spacing.md,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {imageUri && (
          <View style={[styles.imagePreviewContainer, { marginBottom: spacing.sm }]}>
            <Image source={imageUri} style={[styles.imagePreview, { borderRadius: radius.md }]} contentFit="cover" />
            <TouchableOpacity
              style={[styles.removeImageBtn, { backgroundColor: colors.overlay }]}
              onPress={() => setImageUri(undefined)}
            >
              <X color={colors.accentForeground} size={16} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePickImage}
            disabled={disabled || isStreaming}
          >
            <ImagePlus color={colors.textMuted} size={24} />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                fontSize: typography.size.base,
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                borderRadius: radius.xl,
                paddingHorizontal: spacing.md,
                paddingTop: spacing.md,
                paddingBottom: spacing.md,
              },
            ]}
            placeholder="Message Chrono..."
            placeholderTextColor={colors.textSubtle}
            multiline
            maxLength={2000}
            value={text}
            onChangeText={setText}
            editable={!disabled}
            textAlignVertical="center"
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              {
                backgroundColor: isStreaming || canSend ? colors.accent : colors.surfaceElevated,
                borderRadius: radius.full,
              },
            ]}
            onPress={handleSend}
            disabled={disabled || (!canSend && !isStreaming)}
          >
            {isStreaming ? (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <Square color={colors.accentForeground} size={18} fill={colors.accentForeground} />
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn} exiting={FadeOut}>
                <ArrowUp
                  color={canSend ? colors.accentForeground : colors.textMuted}
                  size={20}
                  strokeWidth={3}
                />
              </Animated.View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardStickyView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    minHeight: 40,
    maxHeight: 120, // ~5 lines
    marginHorizontal: 8,
  },
  iconButton: {
    padding: 8,
    marginBottom: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 60,
    height: 60,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});