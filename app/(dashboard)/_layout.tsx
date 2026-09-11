import { Tabs } from "expo-router";
import { TabBar } from "@/components/layout/TabBar";
import { useTheme } from "@/hooks/useTheme";

export default function DashboardLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        lazy: true,
      }}
    >
      <Tabs.Screen name="wallet" options={{ title: "Wallet" }} />
      <Tabs.Screen name="policies" options={{ title: "Policies" }} />
      <Tabs.Screen name="guardians" options={{ title: "Guardians" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
