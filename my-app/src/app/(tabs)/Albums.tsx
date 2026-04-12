import React, { useEffect, useState, useCallback, useRef } from 'react';
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
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';
import Album from '@/src/components/Album/Album';
import ImageViewer from '@/src/components/Image/ImageViewer';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GAP = 2;

// ─── Reusable grid image (same as home) ──────────────────────────────────────
const GalleryImage = React.memo(({ uri, numColumns, onPress }: { uri: string; numColumns: number; onPress: () => void }) => {
  const itemSize = (SCREEN_WIDTH - GAP * (numColumns + 1)) / numColumns;
  return (
    <Pressable style={[styles.imageWrapper, { width: itemSize, height: itemSize }]} onPress={onPress}>
      <Image
        source={{ uri }}
        style={styles.image}
        contentFit="cover"
        recyclingKey={uri}
      />
    </Pressable>
  );
});

// ─── Album detail — images grid identical to home ────────────────────────────
function AlbumDetail({
  album,
  onBack,
}: {
  album: MediaLibrary.Album;
  onBack: () => void;
}) {
  const theme = useTheme();
  const [images, setImages] = useState<{ id: string; uri: string }[]>([]);
  const [endCursor, setEndCursor] = useState('0');
  const [hasNext, setHasNext] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [numColumns, setNumColumns] = useState(3);
  const [viewerIndex, setViewerIndex] = useState(-1);
  const [refreshing, setRefreshing] = useState(false);
  const hasInitialized = useRef(false);

  const itemSize = (SCREEN_WIDTH - GAP * (numColumns + 1)) / numColumns;

  const loadPhotos = useCallback(async (cursor = '0', existing: typeof images = []) => {
    const res = await MediaLibrary.getAssetsAsync({
      album: album.id,
      first: 50,
      after: cursor,
      sortBy: 'creationTime',
      mediaType: 'photo',
    });

    const newImgs = res.assets.map((a) => ({ id: a.id, uri: a.uri }));
    const existingIds = new Set(existing.map((i) => i.id));
    const merged = [...existing, ...newImgs.filter((i) => !existingIds.has(i.id))];

    setImages(merged);
    setEndCursor(res.endCursor);
    setHasNext(res.hasNextPage);
    return merged;
  }, [album.id]);

  const handleEndReached = async () => {
    if (!hasInitialized.current || loadingMore || !hasNext) return;
    setLoadingMore(true);
    await loadPhotos(endCursor, images);
    setLoadingMore(false);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPhotos('0', []);
    setRefreshing(false);
  }, [loadPhotos]);

  const pinchScale = useSharedValue(1);
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => { pinchScale.value = e.scale; })
    .onEnd(() => {
      if (pinchScale.value > 1.1) setNumColumns(3);
      else if (pinchScale.value < 0.9) setNumColumns(4);
      pinchScale.value = 1;
    });

  useEffect(() => {
    loadPhotos().then(() => { hasInitialized.current = true; });
  }, []);

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.detailHeader, { borderBottomColor: theme.colors.text + '18' }]}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.detailTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {album.title}
        </Text>
        <Text style={[styles.detailCount, { color: theme.colors.text + '77' }]}>
          {album.assetCount ?? images.length}
        </Text>
      </View>

      {/* Grid */}
      <GestureDetector gesture={pinchGesture}>
        <FlatList
          key={numColumns}
          data={images}
          numColumns={numColumns}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item, index }) => (
            <GalleryImage
              uri={item.uri}
              numColumns={numColumns}
              onPress={() => setViewerIndex(index)}
            />
          )}
          getItemLayout={(_, index) => ({
            length: itemSize,
            offset: itemSize * Math.floor(index / numColumns),
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
              <Ionicons name="images-outline" size={48} color={theme.colors.text + '33'} />
              <Text style={{ color: theme.colors.text + '66', marginTop: 10 }}>No photos</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator style={{ padding: 16 }} color={theme.colors.primary} />
              : null
          }
        />
      </GestureDetector>

      <ImageViewer
        photos={images}
        initialIndex={viewerIndex >= 0 ? viewerIndex : 0}
        visible={viewerIndex >= 0}
        onClose={() => setViewerIndex(-1)}
        onPhotoDeleted={(id) => setImages((prev) => prev.filter((p) => p.id !== id))}
      />
    </View>
  );
}

// ─── Albums list ─────────────────────────────────────────────────────────────
type AlbumEntry = {
  album: MediaLibrary.Album;
  coverUri?: string;
};

export default function Albums() {
  const theme = useTheme();
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [albums, setAlbums] = useState<AlbumEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<MediaLibrary.Album | null>(null);

  const loadAlbums = useCallback(async () => {
    const raw = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true });
    const entries = await Promise.all(
      raw.map(async (album): Promise<AlbumEntry> => {
        try {
          const res = await MediaLibrary.getAssetsAsync({
            album: album.id, first: 1, sortBy: 'creationTime', mediaType: 'photo',
          });
          return { album, coverUri: res.assets[0]?.uri };
        } catch { return { album }; }
      })
    );
    setAlbums(entries.filter((e) => e.coverUri));
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlbums();
    setRefreshing(false);
  }, [loadAlbums]);

  // Initial load + reload on tab focus
  useFocusEffect(useCallback(() => {
    if (!permission?.granted) return;
    setLoading(true);
    loadAlbums().finally(() => setLoading(false));
  }, [permission]));

  // ── Drill into album ──
  if (selected) {
    return <AlbumDetail album={selected} onBack={() => setSelected(null)} />;
  }

  // ── Permission gate ──
  if (!permission?.granted) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Pressable onPress={requestPermission}>
          <Text style={{ color: theme.colors.primary }}>Grant media library permission</Text>
        </Pressable>
      </View>
    );
  }

  // ── Loading ──
  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // ── Albums grid ──
  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={albums}
        numColumns={2}
        keyExtractor={(item) => item.album.id}
        contentContainerStyle={styles.albumGrid}
        columnWrapperStyle={styles.albumRow}
        renderItem={({ item }) => (
          <Album
            title={item.album.title}
            coverUri={item.coverUri}
            count={item.album.assetCount ?? 0}
            onPress={() => setSelected(item.album)}
          />
        )}
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
            <Ionicons name="folder-open-outline" size={52} color={theme.colors.text + '33'} />
            <Text style={{ color: theme.colors.text + '66', marginTop: 12 }}>No albums found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  albumGrid: { padding: 16, gap: 16 },
  albumRow: { gap: 16 },
  // detail
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  backBtn: { padding: 2 },
  detailTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  detailCount: { fontSize: 13 },
  // grid (same as home)
  gridContainer: { padding: 2 },
  columnWrapper: { gap: 2, marginBottom: 2 },
  imageWrapper: { borderRadius: 4, overflow: 'hidden', backgroundColor: '#ececec' },
  image: { width: '100%', height: '100%' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48, gap: 8 },
});
