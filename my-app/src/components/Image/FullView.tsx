import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  Pressable,
  Dimensions,
  BackHandler,
} from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  photos: any[];
  initialIndex: number;
  onClose: () => void;
};

export default function FullView({ visible, photos, initialIndex, onClose }: Props) {

  //  Android hardware back button
  React.useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true; // prevent default (app exit)
    });
    return () => sub.remove();
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"         //  built-in enter animation
      onRequestClose={onClose}      //  Android back button fallback
      statusBarTranslucent
    >
      <>
        <Animated.View style={[{ flex: 1, backgroundColor: 'black' }]}>

          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            scrollEventThrottle={16}
            removeClippedSubviews={true}
            initialScrollIndex={Math.min(initialIndex, photos.length - 1)}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                <Image
                  source={{ uri: item.uri }}
                  style={{ width, height }}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
                <Text style={{ color: 'white', marginTop: 10 }}>{item.filename}</Text>
              </View>
            )}
          />

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

        </Animated.View>
      </>
    </Modal>
  );
}