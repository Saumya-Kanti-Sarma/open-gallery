export default function RootLayout() {
  return (
    <ThemeProvider>
      <Layout />
    </ThemeProvider>
  );
}

import { Image } from "expo-image";
import { Stack } from "expo-router";
import {
  StatusBar,
  View,
  Text,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useThemeStore } from "../store/ThemeStore";

function Layout() {
  const theme = useTheme();
  const darkmode = useThemeStore((s) => s.darkmode);
  const toggle = useThemeStore((s) => s.toggle);

  return (
    <>
      <StatusBar barStyle={theme.barStyle} />

      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.background,
          },

          headerTitle: () => (
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: theme.colors.text,
                marginLeft: 10
              }}
            >
              Open Gallery
            </Text>
          ),

          headerLeft: () => (
            <View style={{ marginLeft: 12 }}>
              <Image
                source={require("@/assets/images/50px-app-logo.png")}
                style={{ width: 32, height: 32, borderRadius: 8 }}
              />
            </View>
          ),

          headerRight: () => (
            <Pressable
              onPress={toggle}
              style={{ marginRight: 12 }}
            >
              <Ionicons
                name={darkmode ? "moon" : "sunny"}
                size={22}
                color={theme.colors.text}
              />
            </Pressable>
          ),
        }}
      />
    </>
  );
}