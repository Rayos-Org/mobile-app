import { Pressable, StyleSheet, View } from "react-native";
import type { ComponentProps } from "react";
import type { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

type IconName = keyof typeof Ionicons.glyphMap;
// expo-router ships its own bottom-tabs typings; derive the prop type from <Tabs tabBar>.
type BottomTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0];

export const TAB_META: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  wallet: { label: "Wallet", icon: "wallet-outline", iconActive: "wallet" },
  policies: { label: "Policies", icon: "shield-outline", iconActive: "shield" },
  guardians: { label: "Guardians", icon: "people-outline", iconActive: "people" },
  settings: { label: "Settings", icon: "settings-outline", iconActive: "settings" },
};

/** Floating glass tab bar with a sliding active pill — the mobile take on the web sidebar. */
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.tabBar,
            borderColor: colors.tabBarBorder,
            borderRadius: radius["3xl"],
            shadowColor: isDark ? "#000" : "#0B1220",
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const meta = TAB_META[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <TabItem
              key={route.key}
              focused={focused}
              label={meta.label}
              icon={focused ? meta.iconActive : meta.icon}
              testID={`tab-${route.name}`}
              onPress={() => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!focused && !event.defaultPrevented) {
                  Haptics.selectionAsync().catch(() => {});
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  focused,
  label,
  icon,
  onPress,
  testID,
}: {
  focused: boolean;
  label: string;
  icon: IconName;
  onPress: () => void;
  testID: string;
}) {
  const { colors, radius } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      onPressIn={() => scale.set(withSpring(0.92))}
      onPressOut={() => scale.set(withSpring(1))}
      style={styles.item}
    >
      <Animated.View
        style={[
          styles.pill,
          {
            borderRadius: radius.xl,
            backgroundColor: focused ? alpha(colors.primary, 0.14) : "transparent",
          },
          anim,
        ]}
      >
        <Ionicons name={icon} size={22} color={focused ? colors.tabActive : colors.tabInactive} />
        <Text
          variant="small"
          weight={focused ? "600" : "500"}
          style={{ color: focused ? colors.tabActive : colors.tabInactive, fontSize: 11 }}
        >
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: "row",
    padding: 6,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  item: { flex: 1 },
  pill: { alignItems: "center", justifyContent: "center", gap: 3, paddingVertical: 8 },
});
