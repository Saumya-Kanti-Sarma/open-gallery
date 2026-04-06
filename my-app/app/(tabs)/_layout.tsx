import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { StatusBar, Text, View } from 'react-native';
import { Image } from 'expo-image';
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (

    <>
      <StatusBar barStyle={"dark-content"} />
      <View style={{
        display: "flex",
        justifyContent: "space-between",
        marginTop: insets.top
      }}>
        <View style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-start",
          alignItems: "center",
          gap: 1
        }}>
          <Image
            source={require("@/assets/images/app-logo.png")}
            style={{ width: 72, aspectRatio: 1 }}
            contentFit="cover" />
          <Text style={{
            fontWeight: "bold",
            color: theme.colors.green,
            textAlign: "center",
            fontSize: theme.fontSize.xxl
          }}>Open Gallery</Text>

        </View>
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.green,
          tabBarInactiveTintColor: theme.colors.green,
          tabBarStyle: {
            backgroundColor: theme.colors.white,
            paddingBottom: 30,
            height: insets.bottom + 50,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "home",
            tabBarIcon: (({ color, focused }) => (
              <Ionicons name={focused ? "home-sharp" : "home-outline"} color={color} size={24} />
            ))
          }} />
        <Tabs.Screen
          name="albums"
          options={{
            title: "albums",
            tabBarIcon: (({ color, focused }) => (
              <Ionicons name={focused ? "albums-sharp" : "albums-outline"} color={color} size={24} />
            ))
          }} />

        <Tabs.Screen
          name="favourites"
          options={{
            title: "favourite",
            tabBarIcon: (({ color, focused }) => (
              <Ionicons name={focused ? "heart-sharp" : "heart-outline"} color={color} size={24} />
            ))
          }} />
        <Tabs.Screen
          name="settings"
          options={{
            title: "settings",
            tabBarIcon: (({ color, focused }) => (
              <Ionicons name={focused ? "settings" : "settings-outline"} color={color} size={24} />
            ))
          }} />


      </Tabs>
    </>
  );
}
