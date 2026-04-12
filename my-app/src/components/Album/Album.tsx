import React from 'react';
import { Pressable, Text, View, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme/ThemeProvider';

const NUM_COLS = 2;
const GAP = 16;
const SCREEN_WIDTH = Dimensions.get('window').width;
export const ALBUM_CARD_SIZE = (SCREEN_WIDTH - GAP * (NUM_COLS + 1)) / NUM_COLS;

type Props = {
  title: string;
  coverUri?: string;
  count: number;
  onPress: () => void;
};

export default function Album({ title, coverUri, count, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { opacity: pressed ? 0.85 : 1 },
      ]}
    >
      {/* Cover image */}
      <View style={[styles.cover, { backgroundColor: theme.colors.text + '10' }]}>
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={styles.coverImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <Ionicons name="folder-open-outline" size={40} color={theme.colors.text + '44'} />
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text
          style={[styles.name, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={[styles.count, { color: theme.colors.text + '77' }]}>
          {count} {count === 1 ? 'photo' : 'photos'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: ALBUM_CARD_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: ALBUM_CARD_SIZE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  info: {
    paddingTop: 6,
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
  },
  count: {
    fontSize: 12,
    marginTop: 2,
  },
});
