import React from 'react';
import { FlatList, Pressable } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  photos: any[];
  onPressPhoto: (index: number) => void;
  columns?: number;
};

export default function GridImage({
  photos,
  onPressPhoto,
  columns = 4,
}: Props) {
  return (
    <FlatList
      data={photos}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ gap: 4, padding: 4 }}
      columnWrapperStyle={{ gap: 4 }}
      renderItem={({ item, index }) => (
        <Pressable
          onPress={() => onPressPhoto(index)}
          style={{ flex: 1 }}
        >
          <Image
            source={{ uri: item.uri }}
            style={{ width: '100%', aspectRatio: 1 }}
            contentFit="cover"
          />
        </Pressable>
      )}
    />
  );
}