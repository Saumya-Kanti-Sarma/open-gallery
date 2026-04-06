import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';

type Props = {
  photos: any[];
  onPressPhoto: (index: number) => void;
};

export default function ListImage({ photos, onPressPhoto }: Props) {
  return (
    <FlatList
      data={photos}
      // keyExtractor={(item) => item.id}
      // contentContainerStyle={{ padding: 10 }}
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
        >
          {/* 🖼 Left Thumbnail */}
          <Image
            source={{ uri: item.uri }}
            style={{
              width: 70,
              height: 70,
              borderRadius: 8,
              marginRight: 12,
            }}
            contentFit="cover"
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
    />
  );
}