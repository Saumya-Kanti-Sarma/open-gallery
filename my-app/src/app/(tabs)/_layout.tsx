import { TabBar } from '@/src/components/TabBar';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { withLayoutContext } from 'expo-router';

const { Navigator } = createMaterialTopTabNavigator();
const TopTabs = withLayoutContext(Navigator);

export default function TabLayout() {
  return (
    <>
      <TopTabs
        screenOptions={{
          tabBarStyle: { display: "none" },
        }}
      >
        <TopTabs.Screen name="home" />
        <TopTabs.Screen name="albums" />
        <TopTabs.Screen name="favourites" />
        <TopTabs.Screen name="settings" />
      </TopTabs>
      <TabBar />
    </>
  );
}