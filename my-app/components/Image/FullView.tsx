import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  photos: any[];
  initialIndex: number;
  onClose: () => void;
};

export default function FullView({
  visible,
  photos,
  initialIndex,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent>
      <FlatList
        data={photos}
        horizontal
        pagingEnabled
        initialScrollIndex={initialIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              height,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'black',
            }}
          >
            <Image
              source={{ uri: item.uri }}
              style={{ width, height }}
              contentFit="contain"
            />

            <Text style={{ color: 'white', marginTop: 10 }}>
              {item.filename}
            </Text>
          </View>
        )}
      />

      {/* ❌ Close Button */}
      <Pressable
        onPress={onClose}
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.5)',
          padding: 10,
          borderRadius: 20,
        }}
      >
        <Text style={{ color: 'white' }}>Close</Text>
      </Pressable>
    </Modal>
  );
}