import React, { useEffect, useState } from 'react';
import { View, Pressable, Text } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import GridImage from '@/components/Image/GridImage';
import ListImage from '@/components/Image/ListImage';
import FullView from '@/components/Image/FullView';
import { theme } from '@/constants/theme';

export default function HomePage() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>(undefined);
  const [totalCount, setTotalCount] = useState(0);

  const loadPhotos = async (cursor?: string) => {
    if (!permission) return;

    if (!permission.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo'],
        first: 40, // ✅ reduced batch size
        after: cursor,
        sortBy: ['creationTime'],
      });

      if (!cursor) {
        setTotalCount(media.totalCount);
      }

      setTimeout(() => {
        setPhotos((prev) =>
          cursor ? [...prev, ...media.assets] : media.assets
        );
      }, 1000);

      setEndCursor(media.endCursor);
      setHasMore(media.hasNextPage);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      loadPhotos(endCursor);
    }
  };

  useEffect(() => {
    loadPhotos();
  }, [permission]);

  return (
    <View style={{ flex: 1 }}>
      {/* Toggle */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginRight: 10 }}>
        <Pressable onPress={() => setView('grid')}>
          <Text style={{
            fontWeight: view === 'grid' ? 'bold' : 'normal',
            color: view === 'grid' ? theme.colors.green : theme.colors.text
          }}>
            Grid
          </Text>
        </Pressable>

        <Pressable onPress={() => setView('list')}>
          <Text style={{
            fontWeight: view === 'list' ? 'bold' : 'normal',
            color: view === 'list' ? theme.colors.green : theme.colors.text
          }}>
            List
          </Text>
        </Pressable>
      </View>

      {/* ✅ ONLY ONE LIST RENDERED */}
      {view === 'grid' ? (
        <GridImage
          photos={photos}
          onPressPhoto={setSelectedIndex}
          columns={4}
          onEndReached={loadMore}
          isLoading={isLoading}
          hasMore={hasMore}
          loadedCount={photos.length}
          totalCount={totalCount}
        />
      ) : (
        <ListImage
          photos={photos}
          onPressPhoto={setSelectedIndex}
          onEndReached={loadMore}
          isLoading={isLoading}
          hasMore={hasMore}
          loadedCount={photos.length}
          totalCount={totalCount}
        />
      )}

      <FullView
        visible={selectedIndex !== null}
        photos={photos}
        initialIndex={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
      />
    </View>
  );
}