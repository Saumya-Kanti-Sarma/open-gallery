import React, { useEffect, useState } from 'react';
import { View, Pressable, Text, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GridImage from '@/components/Image/GridImage';
import ListImage from '@/components/Image/ListImage';
import FullView from '@/components/Image/FullView';
import { theme } from '@/constants/theme';

export default function HomePage() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const inset = useSafeAreaInsets();

  const snapTo = (target: 'grid' | 'list') => {
    translateX.value = withSpring(target === 'grid' ? 0 : -SCREEN_WIDTH, {
      damping: 30, stiffness: 300, mass: 0.8
    });
    setView(target);
  };

  const currentPage = useSharedValue(0); // 0 = grid, 1 = list

  const gesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-1, 1])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      const base = currentPage.value === 0 ? 0 : -SCREEN_WIDTH; // what's hapenning hr
      const next = base + e.translationX;
      translateX.value = Math.max(-SCREEN_WIDTH, Math.min(0, next));
    })
    .onEnd((e) => {
      const THRESHOLD = SCREEN_WIDTH * 0.3;
      if (e.translationX < -THRESHOLD) {
        currentPage.value = 1;
        snapTo('list');
      } else if (e.translationX > THRESHOLD) {
        currentPage.value = 0;
        snapTo('grid');
      } else {
        snapTo(currentPage.value === 0 ? 'grid' : 'list');
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  useEffect(() => {
    const loadPhotos = async () => {
      if (!permission) return;
      if (!permission.granted) {
        const res = await requestPermission();
        if (!res.granted) return;
      }
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo', 'video'],
        first: 100,
        sortBy: ['creationTime'],
      });
      setPhotos(media.assets);
    };
    loadPhotos();
  }, [permission]);

  return (
    <View style={{ flex: 1 }}>

      {/* Toggle buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginRight: 10 }}>
        <Pressable onPress={() => snapTo('grid')}>
          <Text style={{
            fontWeight: view === 'grid' ? 'bold' : 'normal',
            color: view == "grid" ? theme.colors.green : theme.colors.text
          }}>Grid</Text>
        </Pressable>
        <Pressable onPress={() => snapTo('list')}>
          <Text style={{
            fontWeight: view === 'list' ? 'bold' : 'normal',
            color: view == 'list' ? theme.colors.green : theme.colors.text
          }}>List</Text>
        </Pressable>
      </View>

      <GestureHandlerRootView style={{ flex: 1, overflow: 'hidden' }}>
        <GestureDetector gesture={gesture}>
          <Animated.View style={{ flex: 1 }}>

            {/* ✅ Row that is 2× the screen width — both views always mounted */}
            <Animated.View style={[
              {
                flex: 1,
                flexDirection: 'row',
                width: SCREEN_WIDTH * 2,
              },
              animatedStyle,
            ]}>

              {/* Page 1: Grid */}
              <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                <GridImage
                  photos={photos}
                  onPressPhoto={setSelectedIndex}
                  columns={4}
                />
              </View>

              {/* Page 2: List */}
              <View style={{ width: SCREEN_WIDTH, flex: 1 }}>
                <ListImage
                  photos={photos}
                  onPressPhoto={setSelectedIndex}
                />
              </View>

            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>

      <FullView
        visible={selectedIndex !== null}
        photos={photos}
        initialIndex={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
      />
    </View>
  );
}