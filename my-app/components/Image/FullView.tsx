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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  photos: any[];
  initialIndex: number;
  onClose: () => void;
};

export default function FullView({ visible, photos, initialIndex, onClose }: Props) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  const dismiss = () => {
    translateY.value = 0;
    opacity.value = 1;
    onClose();
  };

  const animatedDismiss = () => {
    translateY.value = withTiming(height, { duration: 250 });
    opacity.value = withTiming(0, { duration: 250 }, () => {
      runOnJS(dismiss)();
    });
  };

  // ✅ Android hardware back button
  React.useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true; // prevent default (app exit)
    });
    return () => sub.remove();
  }, [visible]);

  // ✅ Swipe down to dismiss gesture
  const swipeGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetY([0, 15])       // only activate on downward swipe
    .activeOffsetX([-15, 15])       // cancel if horizontal
    .onUpdate((e) => {
      if (e.translationY < 0) return; // block upward drag
      translateY.value = e.translationY;
      opacity.value = 1 - e.translationY / (height * 0.5);
    })
    .onEnd((e) => {
      if (e.translationY > height * 0.25 || e.velocityY > 800) {
        animatedDismiss();
      } else {
        // snap back
        translateY.value = withTiming(0);
        opacity.value = withTiming(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"         // ✅ built-in enter animation
      onRequestClose={onClose}      // ✅ Android back button fallback
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <GestureDetector gesture={swipeGesture}>
          <Animated.View style={[{ flex: 1, backgroundColor: 'black' }, animatedStyle]}>

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
                <View style={{ width, height, justifyContent: 'center', alignItems: 'center' }}>
                  <Image
                    source={{ uri: item.uri }}
                    style={{ width, height }}
                    contentFit="contain"
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
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}