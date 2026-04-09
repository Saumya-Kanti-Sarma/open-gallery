import { View, FlatList, StyleSheet, Text, Dimensions } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import * as MediaLibrary from "expo-media-library";
import { Image } from 'expo-image';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;

const GalleryImage = React.memo(({ uri }: { uri: string }) => (
  <View style={styles.imageWrapper}>
    <Image
      source={{ uri }}
      style={styles.image}
      contentFit="cover"
      recyclingKey={uri}
    />
  </View>
));

export default function Home() {
  const [galleryImages, setGalleryImages] = useState<{ id: string; uri: string }[]>([]);
  const [numColumns, setNumColumns] = useState(3);
  const [endCursor, setEndCursor] = useState('0');
  const [hasNext, setHasNext] = useState(true);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);
  const hasInitialized = useRef(false);

  const ITEM_SIZE = (SCREEN_WIDTH - GAP * (numColumns + 1)) / numColumns;

  const loadPhotos = async () => {
    if (!hasNext) return;

    const res = await MediaLibrary.getAssetsAsync({
      first: 50,
      after: endCursor.toString(),
      sortBy: 'creationTime'
    });

    const images = res.assets.map(asset => ({
      id: asset.id,
      uri: asset.uri,
    }));

    setGalleryImages(prev => {
      const existingIds = new Set(prev.map(img => img.id));
      const newImages = images.filter(img => !existingIds.has(img.id));
      return [...prev, ...newImages];
    });

    setEndCursor(res.endCursor);
    setHasNext(res.hasNextPage);
  };

  const pinchScale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      pinchScale.value = e.scale;
    })
    .onEnd(() => {
      if (pinchScale.value > 1.1) {
        runOnJS(setNumColumns)(3);
      } else if (pinchScale.value < 0.9) {
        runOnJS(setNumColumns)(4);
      }
      pinchScale.value = 1;
    });

  const handleReachEnd = async () => {
    if (!hasInitialized.current || loadingMorePhotos || !hasNext) return;
    setLoadingMorePhotos(true);
    await loadPhotos();
    setLoadingMorePhotos(false);
  };

  const renderItem = useCallback(({ item }: { item: { id: string; uri: string } }) => (
    <GalleryImage uri={item.uri} />
  ), []);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: ITEM_SIZE,
    offset: ITEM_SIZE * Math.floor(index / numColumns),
    index,
  }), [ITEM_SIZE, numColumns]);

  useEffect(() => {
    loadPhotos().then(() => {
      hasInitialized.current = true;
    });
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
              ? <Text style={{ textAlign: 'center' }}>Loading...</Text>
              : null
          }
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  gridContainer: {
    padding: 2,
  },
  columnWrapper: {
    gap: 2,
    marginBottom: 2,
  },
  imageWrapper: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: "#ececec"
  },
  image: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    backgroundColor: "#ececec"
  },
});