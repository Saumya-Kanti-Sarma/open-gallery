import { Stack } from "expo-router";
import { StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RootLayout() {
  const inset = useSafeAreaInsets();
  return (
    <>
      <StatusBar barStyle={"dark-content"} />
      <View style={{ marginTop: inset.top }} />
      <Stack >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}
