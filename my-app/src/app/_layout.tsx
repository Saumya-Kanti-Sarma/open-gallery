import { ThemeProvider } from "@/theme/ThemeProvider";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import {
  StatusBar,
  View,
  Text,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <StatusBar barStyle={'dark-content'} />

        <Stack
          screenOptions={{

            headerTitle: () => (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "black",
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
                onPress={() => { }}
                style={{ marginRight: 12 }}
              >
                <Ionicons
                  name={"sunny"}
                  size={22}
                  color={"black"}
                />
              </Pressable>
            ),
          }}
        />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
