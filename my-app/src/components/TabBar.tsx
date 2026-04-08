import Ionicons from "@expo/vector-icons/Ionicons";
import { usePathname, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "../constants/theme";
type routeTypes = {
  name: string;
  path: string;
  icon: ["home-outline", "home"] |
  ["albums-outline", "albums"] |
  ["heart-outline", "heart"] |
  ["settings-outline", "settings"];
}
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

  return (
    <View
      style={{
        flexDirection: "row",
        height: inset.bottom + 50,
        backgroundColor: theme.colors.white,
        justifyContent: "space-around",
        alignItems: "center",
      }}
    >
      {routes.map((route: routeTypes) => {
        const focused = pathname === route.path;
        const iconName = focused ? route.icon[1] : route.icon[0];

        return (
          <Pressable key={route.name} onPress={() => router.push(route.path as never)}>
            <Ionicons
              name={iconName}
              size={24}
              color={focused ? theme.colors.green : theme.colors.gray}
            />
          </Pressable>
        );
      })}
    </View>
  );
}