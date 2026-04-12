import React, { useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  clamp,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width: W, height: H } = Dimensions.get('window');
const MAX_SCALE = 5;
const SPRING = { damping: 40, stiffness: 350 };

type Photo = { id: string; uri: string };
type Props = {
  photos: Photo[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
};

// ─── Per-slide zoomable image ─────────────────────────────────────────────────
function ZoomSlide({
  uri,
  onZoomChange,
}: {
  uri: string;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  // Reset on image change
  useEffect(() => {
    scale.value = 1;
    savedScale.value = 1;
    tx.value = 0;
    ty.value = 0;
    savedTx.value = 0;
    savedTy.value = 0;
    onZoomChange(false);
  }, [uri]);

  const notifyZoom = useCallback((s: number) => {
    onZoomChange(s > 1.05);
  }, []);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, 1, MAX_SCALE);
      runOnJS(notifyZoom)(scale.value);
    })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING);
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
        runOnJS(notifyZoom)(1);
      }
      savedScale.value = scale.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        scale.value = withSpring(1, SPRING);
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
        runOnJS(notifyZoom)(1);
      } else {
        scale.value = withSpring(2.5, SPRING);
        savedScale.value = 2.5;
        runOnJS(notifyZoom)(2.5);
      }
    });

  // Pan only when zoomed — when at 1x the FlatList handles horizontal scroll
  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((e, mgr) => {
      if (scale.value > 1.05) mgr.activate();
      else mgr.fail();
    })
    .onUpdate((e) => {
      const maxX = (W * (scale.value - 1)) / 2;
      const maxY = (H * (scale.value - 1)) / 2;
      tx.value = clamp(savedTx.value + e.translationX, -maxX, maxX);
      ty.value = clamp(savedTy.value + e.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const composed = Gesture.Simultaneous(pinch, Gesture.Race(doubleTap, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.slide, animStyle]}>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────
export default function ImageViewer({ photos, initialIndex, visible, onClose }: Props) {
  const [index, setIndex] = React.useState(initialIndex);
  const [isZoomed, setIsZoomed] = React.useState(false);
  const listRef = useRef<FlatList>(null);

  const dismissY = useSharedValue(0);
  const dismissOpacity = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      setIsZoomed(false);
      dismissY.value = 0;
      dismissOpacity.value = 1;
      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      });
    }
  }, [initialIndex, visible]);

  // Vertical swipe-down to dismiss — only when not zoomed
  const dismiss = Gesture.Pan()
    .activeOffsetY([-15, 15])
    .failOffsetX([-20, 20])
    .enabled(!isZoomed)
    .onUpdate((e) => {
      dismissY.value = e.translationY;
      dismissOpacity.value = clamp(1 - Math.abs(e.translationY) / (H * 0.5), 0.15, 1);
    })
    .onEnd((e) => {
      if (Math.abs(e.translationY) > H * 0.18 || Math.abs(e.velocityY) > 700) {
        const dir = e.translationY > 0 ? 1 : -1;
        dismissOpacity.value = withTiming(0, { duration: 180 });
        dismissY.value = withTiming(dir * H, { duration: 220 }, () => {
          runOnJS(onClose)();
        });
      } else {
        dismissY.value = withSpring(0, SPRING);
        dismissOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dismissY.value }],
    opacity: dismissOpacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={dismiss}>
          <Animated.View style={[StyleSheet.absoluteFill, wrapStyle]}>
            <FlatList
              ref={listRef}
              data={photos}
              horizontal
              pagingEnabled
              // Disable native scroll when zoomed so pan gesture takes over
              scrollEnabled={!isZoomed}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
              onMomentumScrollEnd={(e) => {
                const i = Math.round(e.nativeEvent.contentOffset.x / W);
                setIndex(i);
              }}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <ZoomSlide
                    uri={item.uri}
                    onZoomChange={setIsZoomed}
                  />
                </View>
              )}
              removeClippedSubviews
              windowSize={3}
              maxToRenderPerBatch={3}
              initialNumToRender={3}
            />
          </Animated.View>
        </GestureDetector>

        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        <View style={styles.counter}>
          <Text style={styles.counterText}>{index + 1} / {photos.length}</Text>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  slide: {
    width: W,
    height: H,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: W, height: H },
  closeBtn: {
    position: 'absolute',
    top: 52,
    right: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  counter: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  counterText: { color: '#fff', fontSize: 13 },
});
