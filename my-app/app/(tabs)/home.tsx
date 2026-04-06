import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  Modal,
  Dimensions,
  Text,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import GridImage from '@/components/Image/GridImage';
import ListImage from '@/components/Image/ListImage';

const { width, height } = Dimensions.get('window');


export default function HomePage() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [view, setView] = useState("grid");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleToggleView = () => setView((prev) => prev == "grid" ? "list" : "grid")
  //permission + Load Photos
  useEffect(() => {
    const loadPhotos = async () => {
      if (!permission) return;

      if (!permission.granted) {
        const res = await requestPermission();
        if (!res.granted) return;
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: ['photo', 'video'],
        first: 100,
        sortBy: ['creationTime'],
      });

      setPhotos(media.assets);
      /*
      {"albumId": "1028075469",
      "creationTime": 1775397929389, 
      "duration": 0, 
      "filename": "Screenshot_20260405-193529_Google.png",
       "height": 2400,
        "id": "1000078652", 
        "mediaType": "photo", 
        "modificationTime": 1775397930000, 
        "uri": "file:///storage/emulated/0/Pictures/Screenshots/Screenshot_20260405-193529_Google.png", 
        "width": 1080
        }
      */
    };

    loadPhotos();
  }, [permission]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'flex-end', gap: 10, marginRight: 10, alignItems: 'center' }}>
          <Pressable
            onPress={handleToggleView}
            style={{ backgroundColor: "orange", padding: 10, width: 100, borderRadius: 6, marginTop: 5 }}><Text style={{ textAlign: 'center' }}>Grid</Text></Pressable>
          <Pressable
            onPress={handleToggleView}
            style={{ backgroundColor: "orange", padding: 10, width: 100, borderRadius: 6, marginTop: 5 }}><Text style={{ textAlign: 'center' }}>Row</Text></Pressable>
        </View>
        {
          view == "grid" ? (
            <GridImage
              photos={photos}
              onPressPhoto={(index) => setSelectedIndex(index)}
              columns={4}
            />
          ) : (
            <ListImage photos={photos} onPressPhoto={(index) => setSelectedIndex(index)} />
          )
        }
        {/* <ListImage photos={photos} onPressPhoto={(index) => setSelectedIndex(index)} /> */}

        {/* 🔍 Fullscreen Viewer */}
        <Modal visible={selectedIndex !== null} transparent>
          <FlatList
            data={photos}
            horizontal
            pagingEnabled
            initialScrollIndex={selectedIndex ?? 0}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'black',
                }}
              >
                <Image
                  source={{ uri: item.uri }}
                  style={{ width, height, backgroundColor: "yellow" }}
                  contentFit="contain"
                />
                <Text style={{ color: "orange" }}>{item.filename}</Text>
              </View>
            )}
          />

          {/* ❌ Close Button */}
          <Pressable
            onPress={() => setSelectedIndex(null)}
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

      </View>
    </SafeAreaView>
  );
}