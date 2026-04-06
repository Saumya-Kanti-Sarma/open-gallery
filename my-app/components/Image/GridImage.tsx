import React from 'react';
import { FlatList, Pressable, View, Text, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/constants/theme';

type Props = {
  photos: any[];
  onPressPhoto: (index: number) => void;
  columns?: number;
  onEndReached?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  loadedCount?: number;
  totalCount?: number;
};

export default function GridImage({
  photos,
  onPressPhoto,
  columns = 4,
  onEndReached,
  isLoading = false,
  hasMore = true,
  loadedCount = 0,
  totalCount = 0,
}: Props) {
  const renderFooter = () => {
    if (!hasMore && photos.length > 0) {
      return (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <Text style={{ color: theme.colors.text, fontSize: 12 }}>
            All {totalCount} items loaded
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator size="small" color={theme.colors.green} />
          <Text style={{ marginTop: 8, color: theme.colors.text, fontSize: 12 }}>
            Loading {loadedCount} of {totalCount}...
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      data={photos}
      numColumns={columns}
      keyExtractor={(item) => item.filename}
      contentContainerStyle={{ gap: 4, padding: 4 }}
      columnWrapperStyle={{ gap: 4 }}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => onPressPhoto(index)}
          style={{ flex: 1 }}
          key={index}
        >
          <Image
            key={index}
            source={{ uri: item.uri }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </Pressable>
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={20}
      updateCellsBatchingPeriod={50}
      initialNumToRender={30}
      windowSize={10}
      scrollEventThrottle={16}
    />
  );
}