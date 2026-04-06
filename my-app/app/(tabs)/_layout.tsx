import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      initialRouteName="home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#007aff',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#fff',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'home') {
            iconName = 'home-outline';
          } else if (route.name === 'albums') {
            iconName = 'albums-outline';
          } else if (route.name === 'favourites') {
            iconName = 'heart-outline';
          } else if (route.name === 'settings') {
            iconName = 'settings-outline';
          } else {
            iconName = 'help-outline'; // fallback
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="albums" options={{ title: 'Albums' }} />
      <Tabs.Screen name="favourites" options={{ title: 'Favourites' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
