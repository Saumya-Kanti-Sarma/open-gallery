import { View, FlatList, StyleSheet, Text, Dimensions, Pressable, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import * as MediaLibrary from "expo-media-library";
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import ImageViewer from '@/src/components/Image/ImageViewer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;

type Photo = { id: string; uri: string };

const GalleryImage = React.memo(({ uri, onPress }: { uri: string; onPress: () => void }) => (
  <Pressable style={styles.imageWrapper} onPress={onPress}>
    <Image source={{ uri }} style={styles.image} contentFit="cover" recyclingKey={uri} />
  </Pressable>
));

export default function Home() {
  const theme = useTheme();
  const [galleryImages, setGalleryImages] = useState<Photo[]>([]);
  const [numColumns, setNumColumns] = useState(3);
  const [endCursor, setEndCursor] = useState('');
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const hasInitialized = useRef(false);

  const ITEM_SIZE = (SCREEN_WIDTH - GAP * (numColumns + 1)) / numColumns;

  // Load first page fresh
  const reload = useCallback(async () => {
    const res = await MediaLibrary.getAssetsAsync({ first: 50, sortBy: 'creationTime' });
    setGalleryImages(res.assets.map(a => ({ id: a.id, uri: a.uri })));
    setEndCursor(res.endCursor);
    setHasNext(res.hasNextPage);
  }, []);

  // Append next page
  const loadMore = useCallback(async (cursor: string) => {
    const res = await MediaLibrary.getAssetsAsync({ first: 50, after: cursor, sortBy: 'creationTime' });
    const incoming = res.assets.map(a => ({ id: a.id, uri: a.uri }));
    setGalleryImages(prev => {
      const seen = new Set(prev.map(p => p.id));
      return [...prev, ...incoming.filter(p => !seen.has(p.id))];
    });
    setEndCursor(res.endCursor);
    setHasNext(res.hasNextPage);
  }, []);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }, [reload]);

  // Infinite scroll
  const handleEndReached = useCallback(async () => {
    if (!hasInitialized.current || loadingMore || !hasNext) return;
    setLoadingMore(true);
    await loadMore(endCursor);
    setLoadingMore(false);
  }, [loadingMore, hasNext, endCursor]);

  // Reload when tab comes into focus
  useFocusEffect(useCallback(() => {
    reload().then(() => { hasInitialized.current = true; });
  }, []));

  const pinchScale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => { pinchScale.value = e.scale; })
    .onEnd(() => {
      if (pinchScale.value > 1.1) setNumColumns(3);
      else if (pinchScale.value < 0.9) setNumColumns(4);
      pinchScale.value = 1;
    });

  const renderItem = useCallback(({ item, index }: { item: Photo; index: number }) => (
    <GalleryImage uri={item.uri} onPress={() => setViewerIndex(index)} />
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_SIZE,
    offset: ITEM_SIZE * Math.floor(index / numColumns),
    index,
  }), [ITEM_SIZE, numColumns]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <GestureDetector gesture={pinchGesture}>
        <FlatList
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.columnWrapper}
          numColumns={numColumns}
          key={numColumns}
          data={galleryImages}
          keyExtractor={(item) => item.id}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialNumToRender={30}
          maxToRenderPerBatch={20}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListFooterComponent={
            loadingMore
              ? <Text style={{ textAlign: 'center', padding: 12, color: theme.colors.text }}>Loading...</Text>
              : null
          }
        />
      </GestureDetector>

      <ImageViewer
        photos={galleryImages}
        initialIndex={viewerIndex >= 0 ? viewerIndex : 0}
        visible={viewerIndex >= 0}
        onClose={() => setViewerIndex(-1)}
        onPhotoDeleted={(id) => setGalleryImages(prev => prev.filter(p => p.id !== id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gridContainer: { padding: 2 },
  columnWrapper: { gap: 2, marginBottom: 2 },
  imageWrapper: { flex: 1, aspectRatio: 1, borderRadius: 4, overflow: 'hidden', backgroundColor: '#ececec' },
  image: { width: '100%', height: '100%', aspectRatio: 1, backgroundColor: '#ececec' },
});
