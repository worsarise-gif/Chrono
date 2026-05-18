import React, { useState } from 'react';
import { View, StyleSheet, TouchableWithoutFeedback, Modal, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { X, Share2 } from 'lucide-react-native';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../theme';
import Toast from 'react-native-toast-message';

type ImageMessageProps = {
  uri: string;
  isGenerated?: boolean;
};

const AnimatedImage = Animated.createAnimatedComponent(Image);

export const ImageMessage: React.FC<ImageMessageProps> = React.memo(({ uri, isGenerated }) => {
  const { radius, colors, spacing } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const scale = useSharedValue(1);

  const onPinchEvent = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      scale.value = Math.max(1, event.nativeEvent.scale);
    } else if (event.nativeEvent.state === State.END) {
      scale.value = withTiming(1);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handleShare = async () => {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        Toast.show({ type: 'error', text1: 'Sharing is not available on this device' });
        return;
      }

      const fileUri = (FileSystem.documentDirectory || '') + 'shared-image.jpg';
      await FileSystem.downloadAsync(uri, fileUri);

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error(error);
      Toast.show({ type: 'error', text1: 'Failed to share image' });
    }
  };

  return (
    <>
      <TouchableWithoutFeedback onPress={() => setModalVisible(true)}>
        <View style={[styles.container, { borderRadius: radius.lg }]}>
          <Image
            source={uri}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {isGenerated && (
            <View style={styles.badgeContainer}>
              <Badge variant="accent" label="AI Generated" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <GestureHandlerRootView style={[styles.modalBackground, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalHeader, { paddingTop: spacing.xxxxl }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} hitSlop={20}>
              <X color={colors.accentForeground} size={24} />
            </TouchableOpacity>
          </View>

          <PinchGestureHandler onHandlerStateChange={onPinchEvent} onGestureEvent={onPinchEvent}>
            <AnimatedImage
              source={uri}
              style={[styles.fullImage, animatedStyle]}
              contentFit="contain"
            />
          </PinchGestureHandler>

          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
              <Share2 color={colors.accentForeground} size={24} />
            </TouchableOpacity>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
});

ImageMessage.displayName = 'ImageMessage';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxHeight: 300,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 8,
  },
  image: {
    width: '100%',
    height: 300,
  },
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  modalHeader: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  modalFooter: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    zIndex: 1,
  },
  shareButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 50,
  },
});