import React, { useEffect, useState } from 'react';
import {
  View,
  Pressable,
  Text,
} from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GridImage from '@/components/Image/GridImage';
import ListImage from '@/components/Image/ListImage';
import FullView from '@/components/Image/FullView';

export default function HomePage() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [photos, setPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [view, setView] = useState("grid");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const inset = useSafeAreaInsets();
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
    <View style={{ flex: 1, marginTop: inset.top }}>
      <View style={{ display: 'flex', flexDirection: "row", justifyContent: 'flex-end', gap: 10, marginRight: 10, alignItems: 'center' }}>
        <Pressable
          onPress={handleToggleView}>
          <Text style={{ textAlign: 'center' }}>Grid</Text>
        </Pressable>
        <Pressable
          onPress={handleToggleView}>
          <Text style={{ textAlign: 'center' }}>Row</Text>
        </Pressable>
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
      {/* Fullscreen Viewer */}
      <FullView
        visible={selectedIndex !== null}
        photos={photos}
        initialIndex={selectedIndex ?? 0}
        onClose={() => setSelectedIndex(null)}
      />

    </View>
  );
}