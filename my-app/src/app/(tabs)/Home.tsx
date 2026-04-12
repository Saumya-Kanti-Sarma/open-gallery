import { View, FlatList, StyleSheet, Text, Dimensions, Pressable } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import * as MediaLibrary from "expo-media-library";
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import ImageViewer from '@/src/components/Image/ImageViewer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;

type Photo = { id: string; uri: string };

const GalleryImage = React.memo(({ uri, onPress }: { uri: string; onPress: () => void }) => (
  <Pressable style={styles.imageWrapper} onPress={onPress}>
    <Image
      source={{ uri }}
      style={styles.image}
      contentFit="cover"
      recyclingKey={uri}
    />
  </Pressable>
));

export default function Home() {
  const [galleryImages, setGalleryImages] = useState<Photo[]>([]);
  const [numColumns, setNumColumns] = useState(3);
  const [endCursor, setEndCursor] = useState('0');
  const [hasNext, setHasNext] = useState(true);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const hasInitialized = useRef(false);

  const ITEM_SIZE = (SCREEN_WIDTH - GAP * (numColumns + 1)) / numColumns;

  const loadPhotos = async () => {
    if (!hasNext) return;
    const res = await MediaLibrary.getAssetsAsync({
      first: 50,
      after: endCursor.toString(),
      sortBy: 'creationTime',
    });
    const images = res.assets.map(a => ({ id: a.id, uri: a.uri }));
    setGalleryImages(prev => {
      const existingIds = new Set(prev.map(img => img.id));
      return [...prev, ...images.filter(img => !existingIds.has(img.id))];
    });
    setEndCursor(res.endCursor);
    setHasNext(res.hasNextPage);
  };

  const pinchScale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => { pinchScale.value = e.scale; })
    .onEnd(() => {
      if (pinchScale.value > 1.1) setNumColumns(3);
      else if (pinchScale.value < 0.9) setNumColumns(4);
      pinchScale.value = 1;
    });

  const handleReachEnd = async () => {
    if (!hasInitialized.current || loadingMorePhotos || !hasNext) return;
    setLoadingMorePhotos(true);
    await loadPhotos();
    setLoadingMorePhotos(false);
  };

  const renderItem = useCallback(({ item, index }: { item: Photo; index: number }) => (
    <GalleryImage uri={item.uri} onPress={() => setViewerIndex(index)} />
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_SIZE,
    offset: ITEM_SIZE * Math.floor(index / numColumns),
    index,
  }), [ITEM_SIZE, numColumns]);

  useEffect(() => {
    loadPhotos().then(() => { hasInitialized.current = true; });
  }, []);

  return (
    <View style={styles.container}>
      <GestureDetector gesture={pinchGesture}>
        <FlatList
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.columnWrapper}
          numColumns={numColumns}
          key={numColumns}
          data={galleryImages}
          keyExtractor={(item) => item.id}
          onEndReached={handleReachEnd}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          renderItem={renderItem}
          getItemLayout={getItemLayout}
          initialNumToRender={30}
          maxToRenderPerBatch={20}
          windowSize={5}
          ListFooterComponent={
            loadingMorePhotos
              ? <Text style={{ textAlign: 'center', padding: 12 }}>Loading...</Text>
              : null
          }
        />
      </GestureDetector>

      <ImageViewer
        photos={galleryImages}
        initialIndex={viewerIndex >= 0 ? viewerIndex : 0}
        visible={viewerIndex >= 0}
        onClose={() => setViewerIndex(-1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gridContainer: { padding: 2 },
  columnWrapper: { gap: 2, marginBottom: 2 },
  imageWrapper: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#ececec',
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    backgroundColor: '#ececec',
  },
});
