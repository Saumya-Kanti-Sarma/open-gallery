import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  Modal,
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  StatusBar,
  Text,
  Pressable,
  ToastAndroid,
  Platform,
  Alert,
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
import { usePhotoActions } from '@/src/hooks/usePhotoActions';

const { width: W, height: H } = Dimensions.get('window');
const MAX_SCALE = 5;
const SPRING = { damping: 40, stiffness: 350 };

// A photo whose URI contains this segment is already in the favourites album.
const FAVOURITES_PATH_SEGMENT = 'open-gallery/favourites';

type Photo = { id: string; uri: string };
type Props = {
  photos: Photo[];
  initialIndex: number;
  visible: boolean;
  onClose: () => void;
  onPhotoDeleted?: (id: string) => void;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isInFavourites(uri: string): boolean {
  return uri.toLowerCase().includes(FAVOURITES_PATH_SEGMENT);
}

function toast(msg: string) {
  if (Platform.OS === 'android') ToastAndroid.show(msg, ToastAndroid.SHORT);
  else Alert.alert('', msg);
}

// ─── Per-slide zoomable image ─────────────────────────────────────────────────
function ZoomSlide({ uri, onZoomChange }: { uri: string; onZoomChange: (z: boolean) => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);

  useEffect(() => {
    scale.value = 1; savedScale.value = 1;
    tx.value = 0; ty.value = 0;
    savedTx.value = 0; savedTy.value = 0;
    onZoomChange(false);
  }, [uri]);

  const notifyZoom = useCallback((s: number) => { onZoomChange(s > 1.05); }, []);

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
        savedScale.value = 1; savedTx.value = 0; savedTy.value = 0;
        runOnJS(notifyZoom)(1);
      } else {
        scale.value = withSpring(2.5, SPRING);
        savedScale.value = 2.5;
        runOnJS(notifyZoom)(2.5);
      }
    });

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesMove((e, mgr) => { scale.value > 1.05 ? mgr.activate() : mgr.fail(); })
    .onUpdate((e) => {
      const maxX = (W * (scale.value - 1)) / 2;
      const maxY = (H * (scale.value - 1)) / 2;
      tx.value = clamp(savedTx.value + e.translationX, -maxX, maxX);
      ty.value = clamp(savedTy.value + e.translationY, -maxY, maxY);
    })
    .onEnd(() => { savedTx.value = tx.value; savedTy.value = ty.value; });

  const composed = Gesture.Simultaneous(pinch, Gesture.Race(doubleTap, pan));

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.slide, animStyle]}>
        <Image source={{ uri }} style={styles.image} contentFit="contain" cachePolicy="memory-disk" />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Main viewer ──────────────────────────────────────────────────────────────
export default function ImageViewer({ photos, initialIndex, visible, onClose, onPhotoDeleted }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const listRef = useRef<FlatList>(null);
  const { addToFavourites, removeFromFavourites, deletePhoto } = usePhotoActions();

  // ── Favourite state ─────────────────────────────────────────────────────────
  // Seed from URI so photos already in the favourites folder show a red heart
  // immediately — no async look-up needed.
  const [favouritedIds, setFavouritedIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    photos.forEach((p) => { if (isInFavourites(p.uri)) ids.add(p.id); });
    return ids;
  });

  // Re-sync whenever the photos array reference changes (parent reloads data).
  useEffect(() => {
    setFavouritedIds((prev) => {
      const next = new Set(prev);
      photos.forEach((p) => { if (isInFavourites(p.uri)) next.add(p.id); });
      return next;
    });
  }, [photos]);

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

  const currentPhoto = photos[index];
  const isFavourited = currentPhoto ? favouritedIds.has(currentPhoto.id) : false;

  // ── Toggle favourite ────────────────────────────────────────────────────────
  const handleFavourite = async () => {
    if (!currentPhoto || loadingAction) return;
    setLoadingAction(true);

    if (isFavourited) {
      const result = await removeFromFavourites(currentPhoto.id);
      setLoadingAction(false);
      if (result === 'removed') {
        setFavouritedIds((prev) => {
          const next = new Set(prev);
          next.delete(currentPhoto.id);
          return next;
        });
        toast('Removed from favourites');
      } else {
        toast('Could not remove from favourites');
      }
    } else {
      const result = await addToFavourites(currentPhoto.id);
      setLoadingAction(false);
      if (result === 'favourited') {
        setFavouritedIds((prev) => new Set(prev).add(currentPhoto.id));
        toast('Added to open-gallery/favourites');
      } else {
        toast('Could not add to favourites');
      }
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!currentPhoto || loadingAction) return;
    setLoadingAction(true);
    const result = await deletePhoto(currentPhoto.id);
    setLoadingAction(false);
    if (result === 'deleted') {
      onPhotoDeleted?.(currentPhoto.id);
      if (photos.length <= 1) {
        onClose();
      } else {
        const next = index >= photos.length - 1 ? index - 1 : index;
        setIndex(next);
        requestAnimationFrame(() => {
          listRef.current?.scrollToIndex({ index: next, animated: false });
        });
      }
    }
  };

  // ── Dismiss gesture ─────────────────────────────────────────────────────────
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
        dismissY.value = withTiming(dir * H, { duration: 220 }, () => { runOnJS(onClose)(); });
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar hidden />
      <GestureHandlerRootView style={styles.root}>
        <GestureDetector gesture={dismiss}>
          <Animated.View style={[StyleSheet.absoluteFill, wrapStyle]}>
            <FlatList
              ref={listRef}
              data={photos}
              horizontal
              pagingEnabled
              scrollEnabled={!isZoomed}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              initialScrollIndex={initialIndex}
              getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
              onMomentumScrollEnd={(e) => {
                setIndex(Math.round(e.nativeEvent.contentOffset.x / W));
              }}
              renderItem={({ item }) => (
                <View style={styles.slide}>
                  <ZoomSlide uri={item.uri} onZoomChange={setIsZoomed} />
                </View>
              )}
              removeClippedSubviews
              windowSize={3}
              maxToRenderPerBatch={3}
              initialNumToRender={3}
            />
          </Animated.View>
        </GestureDetector>

        {/* Close */}
        <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>

        {/* Counter */}
        <View style={styles.counter}>
          <Text style={styles.counterText}>{index + 1} / {photos.length}</Text>
        </View>

        {/* Bottom action bar */}
        <View style={styles.bottomBar}>
          <Pressable onPress={handleFavourite} disabled={loadingAction} style={styles.actionBtn} hitSlop={12}>
            <Ionicons
              name={isFavourited ? 'heart' : 'heart-outline'}
              size={28}
              color={isFavourited ? '#e74c3c' : '#fff'}
            />
            <Text style={styles.actionLabel}>{isFavourited ? 'Unfavourite' : 'Favourite'}</Text>
          </Pressable>

          <Pressable onPress={handleDelete} disabled={loadingAction} style={styles.actionBtn} hitSlop={12}>
            <Ionicons name="trash-outline" size={28} color="#ff6b6b" />
            <Text style={[styles.actionLabel, { color: '#ff6b6b' }]}>Delete</Text>
          </Pressable>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  slide: { width: W, height: H, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
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
    top: 58,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
  },
  counterText: { color: '#fff', fontSize: 13 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingBottom: 36,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  actionBtn: { alignItems: 'center', gap: 4 },
  actionLabel: { color: '#fff', fontSize: 12 },
});