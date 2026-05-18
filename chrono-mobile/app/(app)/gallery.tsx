import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl, Modal, Dimensions } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';
import { Image } from 'expo-image';
import Animated, { FadeIn, useReducedMotion, useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { PinchGestureHandler, PanGestureHandler } from 'react-native-gesture-handler';
import { PanelLeft, Share2, X, ImageOff } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../src/theme';
import { MOCK_IMAGES } from '../../src/mock/images';
import { IconButton } from '../../src/components/ui/IconButton';
import { Skeleton } from '../../src/components/ui/Skeleton';
import * as Haptics from 'expo-haptics';
import { Button } from '../../src/components/ui/Button';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AnimatedImage = Animated.createAnimatedComponent(Image);

export default function GalleryScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [images, setImages] = useState(MOCK_IMAGES); // allow emptying for test
  const [selectedImage, setSelectedImage] = useState<any>(null);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  }, []);

  const handleShare = async (url: string) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(url);
    }
  };

  const renderItem = ({ item, index }: any) => {
    const cellSize = (SCREEN_WIDTH - spacing.md * 2 - spacing.xs) / 2;

    return (
      <Animated.View entering={reducedMotion ? undefined : FadeIn.delay(index * 30)}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedImage(item);
          }}
          style={{ width: cellSize, height: cellSize, marginBottom: spacing.xs }}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={{ width: '100%', height: '100%', borderRadius: radius.md }}
            contentFit="cover"
            transition={200}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const handlePinch = (event: any) => {
    scale.value = event.nativeEvent.scale;
    if (event.nativeEvent.state === 4) { // State.END
       scale.value = withSpring(1);
    }
  };

  const closeSelectedImage = () => {
    setSelectedImage(null);
    translateY.value = 0;
  };

  const handlePan = (event: any) => {
    translateY.value = event.nativeEvent.translationY;
    if (event.nativeEvent.state === 4) { // State.END
      if (translateY.value > 100) {
        runOnJS(closeSelectedImage)();
      } else {
        translateY.value = withSpring(0);
      }
    }
  };

  const animatedLightboxStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ]
    };
  });

  return (
    <Animated.View entering={reducedMotion ? undefined : FadeIn.duration(200)} style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing.md }]}>
        <IconButton
          icon={PanelLeft as any}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          accessibilityLabel="Open drawer"
        />
        <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.size.xl, fontWeight: typography.weight.bold as any, marginLeft: spacing.sm }]}>
          Generated Images
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {images.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ImageOff size={64} color={colors.textSubtle} style={{ marginBottom: spacing.lg }} />
            <Text style={{ color: colors.text, fontSize: typography.size.lg, fontWeight: typography.weight.semibold as any, marginBottom: spacing.sm }}>
              No images yet
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.size.base, textAlign: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.xxl }}>
              Generate images by asking Chrono to create one
            </Text>
            <Button label="Start chatting" onPress={() => router.push('/')} />
          </View>
        ) : isRefreshing ? (
          <View style={[styles.grid, { paddingHorizontal: spacing.md }]}>
            {Array.from({ length: 8 }).map((_, i) => (
              <View key={i} style={{ width: '48%', aspectRatio: 1, marginBottom: spacing.xs }}>
                <Skeleton width="100%" height={200} borderRadius={radius.md} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={images}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.accent} />
            }
          />
        )}
      </View>

      {/* Lightbox Modal */}
      <Modal visible={!!selectedImage} transparent animationType="fade">
        <View style={styles.lightboxContainer}>
          {/* Top Bar */}
          <View style={[styles.lightboxTopBar, { paddingTop: insets.top }]}>
            <TouchableOpacity style={styles.lightboxIconBtn} onPress={closeSelectedImage}>
              <X color="#fff" size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.lightboxIconBtn} onPress={() => handleShare(selectedImage?.imageUrl)}>
              <Share2 color="#fff" size={24} />
            </TouchableOpacity>
          </View>

          {/* Image with Gestures */}
          <PanGestureHandler onGestureEvent={handlePan} onHandlerStateChange={handlePan}>
            <Animated.View style={styles.lightboxImageWrapper}>
              <PinchGestureHandler onGestureEvent={handlePinch} onHandlerStateChange={handlePinch}>
                <Animated.View style={[{ width: '100%', height: '100%' }, animatedLightboxStyle]}>
                  <Image
                    source={{ uri: selectedImage?.imageUrl }}
                    style={styles.lightboxImage}
                    contentFit="contain"
                  />
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>

          {/* Bottom Bar */}
          <View style={[styles.lightboxBottomBar, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
            <Text style={[styles.lightboxPrompt, { fontSize: typography.size.sm }]} numberOfLines={3}>
              {selectedImage?.prompt}
            </Text>
            <Text style={[styles.lightboxDate, { fontSize: typography.size.xs }]}>
              {selectedImage?.createdAt ? format(new Date(selectedImage.createdAt), 'MMM d, yyyy') : ''}
            </Text>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  headerTitle: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  lightboxTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    zIndex: 10,
  },
  lightboxIconBtn: {
    padding: 8,
  },
  lightboxImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxBottomBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  lightboxPrompt: {
    color: '#fff',
    marginBottom: 4,
  },
  lightboxDate: {
    color: '#aaa',
  },
});
