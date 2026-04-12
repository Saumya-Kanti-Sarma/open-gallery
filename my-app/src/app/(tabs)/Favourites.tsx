import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Dimensions,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import ImageViewer from '@/src/components/Image/ImageViewer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;
const NUM_COLS = 3;
const ITEM_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLS + 1)) / NUM_COLS;
const FAVOURITES_ALBUM = 'favourites';

type Photo = { id: string; uri: string };

const Thumb = React.memo(({ uri, onPress }: { uri: string; onPress: () => void }) => (
  <Pressable style={styles.thumb} onPress={onPress}>
    <Image source={{ uri }} style={styles.image} contentFit="cover" recyclingKey={uri} />
  </Pressable>
));

export default function Favourites() {
  const theme = useTheme();
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [endCursor, setEndCursor] = useState('0');
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const hasInitialized = useRef(false);

  const loadPhotos = useCallback(async (cursor = '0', existing: Photo[] = []) => {
    const album = await MediaLibrary.getAlbumAsync('favourites');
    if (!album) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    const res = await MediaLibrary.getAssetsAsync({
      album: album.id,
      first: 60,
      after: cursor === '0' ? undefined : cursor,
      sortBy: [MediaLibrary.SortBy.creationTime],
      mediaType: 'photo',
    });
    const newPhotos = res.assets.map((a) => ({ id: a.id, uri: a.uri }));
    const existingIds = new Set(existing.map((p) => p.id));
    const merged = [...existing, ...newPhotos.filter((p) => !existingIds.has(p.id))];
    setPhotos(merged);
    setEndCursor(res.endCursor);
    setHasNext(res.hasNextPage);
    setLoading(false);
    return merged;
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos('0', []);
    setRefreshing(false);
  }, [loadPhotos]);

  const handleEndReached = async () => {
    if (!hasInitialized.current || loadingMore || !hasNext) return;
    setLoadingMore(true);
    await loadPhotos(endCursor, photos);
    setLoadingMore(false);
  };

  // Reload every time the tab comes into focus
  useFocusEffect(useCallback(() => {
    if (!permission?.granted) return;
    setLoading(true);
    loadPhotos('0', []).then(() => { hasInitialized.current = true; });
  }, [permission]));

  if (!permission?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={requestPermission}>
          <Text style={{ color: theme.colors.primary }}>Grant media library permission</Text>
        </Pressable>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={photos}
        numColumns={NUM_COLS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item, index }) => (
          <Thumb uri={item.uri} onPress={() => setViewerIndex(index)} />
        )}
        getItemLayout={(_, index) => ({
          length: ITEM_SIZE,
          offset: (ITEM_SIZE + GAP) * Math.floor(index / NUM_COLS),
          index,
        })}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={52} color={theme.colors.text + '33'} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No favourites yet</Text>
            <Text style={[styles.emptyHint, { color: theme.colors.text + '66' }]}>
              Open any photo and tap the heart to save it here
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore
            ? <ActivityIndicator style={{ padding: 16 }} color={theme.colors.primary} />
            : null
        }
      />

      <ImageViewer
        photos={photos}
        initialIndex={viewerIndex >= 0 ? viewerIndex : 0}
        visible={viewerIndex >= 0}
        onClose={() => setViewerIndex(-1)}
        onPhotoDeleted={(id) => setPhotos((prev) => prev.filter((p) => p.id !== id))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  grid: { padding: 2 },
  row: { gap: 2, marginBottom: 2 },
  thumb: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#ececec',
  },
  image: { width: '100%', height: '100%' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 40,
    gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyHint: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
