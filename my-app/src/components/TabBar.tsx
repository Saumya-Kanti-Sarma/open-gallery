import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

type routeTypes = {
  name: string;
  path: string;
  icon:
  | ["home-outline", "home"]
  | ["albums-outline", "albums"]
  | ["heart-outline", "heart"]
  | ["settings-outline", "settings"];
};

const routes: routeTypes[] = [
  { name: "Home", path: "/Home", icon: ["home-outline", "home"] },
  { name: "Albums", path: "/Albums", icon: ["albums-outline", "albums"] },
  { name: "Favourites", path: "/Favourites", icon: ["heart-outline", "heart"] },
  { name: "Settings", path: "/Settings", icon: ["settings-outline", "settings"] },
];

export function TabBar() {
  const inset = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.background,
          height: inset.bottom + 50,
          paddingBottom: inset.bottom - 21,
        },
      ]}
    >
      {routes.map((route) => {
        const focused = pathname === route.path;
        const iconName = focused ? route.icon[1] : route.icon[0];

        return (
          <Pressable
            key={route.name}
            onPress={() => router.push(route.path as never)}
            style={styles.item}
          >
            <Ionicons
              name={iconName}
              size={24}
              color={
                focused
                  ? theme.colors.primary
                  : theme.colors.text
              }
            />

            <Text
              style={[
                styles.label,
                {
                  color: focused
                    ? theme.colors.primary
                    : theme.colors.text,
                },
              ]}
            >
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },

  item: {
    justifyContent: "center",
    alignItems: "center",
  },

  label: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 2,
  },
});