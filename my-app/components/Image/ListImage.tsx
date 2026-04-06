import React from 'react';
import { FlatList, Pressable, Text, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/constants/theme';

type Props = {
  photos: any[];
  onPressPhoto: (index: number) => void;
  onEndReached?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  loadedCount?: number;
  totalCount?: number;
};

export default function ListImage({
  photos,
  onPressPhoto,
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
      keyExtractor={(item) => item.filename}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => onPressPhoto(index)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            borderRadius: 12,
            marginBottom: 10,
            backgroundColor: '#f7f3f3',
          }}
          key={index}
        >
          {/*Left Thumbnail */}
          <Image
            source={{ uri: item.uri }}
            key={index}
            style={{
              width: 70,
              height: 70,
              borderRadius: 8,
              marginRight: 12,
            }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          {/* 📄 Right Content */}
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                fontWeight: '600',
                marginBottom: 6,
              }}
            >
              {item.filename || 'Image'}
            </Text>

            <Text style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
              {new Date(item.creationTime).toLocaleString()}
            </Text>

            <Text style={{ fontSize: 11, color: '#888' }}>
              {item.uri}
            </Text>
          </View>
        </Pressable>
      )}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      removeClippedSubviews={true}
      maxToRenderPerBatch={15}
      updateCellsBatchingPeriod={50}
      initialNumToRender={20}
      windowSize={10}
      scrollEventThrottle={16}
      getItemLayout={(data, index) => ({
        length: 100,
        offset: 100 * index,
        index,
      })}
    />
  );
}