import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme, useThemePreference, type ThemePreference } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

const OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: "system", label: "System", icon: "phone-portrait-outline" },
  { value: "light", label: "Light", icon: "sunny-outline" },
  { value: "dark", label: "Dark", icon: "moon-outline" },
];

/**
 * Appearance picker. Defaults to "System" so the app opens matching the OS;
 * Light/Dark override is persisted. `compact` renders a single cycling icon
 * button for headers.
 */
export function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const { colors, radius, isDark } = useTheme();
  const { preference, setPreference } = useThemePreference();

  if (compact) {
    const next: ThemePreference = preference === "system" ? (isDark ? "light" : "dark") : preference === "dark" ? "light" : "dark";
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Switch to ${next} mode`}
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setPreference(next);
        }}
        style={({ pressed }) => [
          styles.compact,
          { borderColor: colors.border, backgroundColor: alpha(colors.card, 0.7), borderRadius: radius.lg, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <Ionicons name={isDark ? "moon" : "sunny"} size={18} color={isDark ? "#A5B4FC" : "#F59E0B"} />
      </Pressable>
    );
  }

  return (
    <View style={[styles.track, { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: radius.xl }]}>
      {OPTIONS.map((o) => {
        const active = o.value === preference;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setPreference(o.value);
            }}
            style={[
              styles.option,
              { borderRadius: radius.lg },
              active ? { backgroundColor: colors.primary } : null,
            ]}
          >
            <Ionicons name={o.icon} size={16} color={active ? colors.primaryForeground : colors.mutedForeground} />
            <Text variant="small" weight="600" style={{ color: active ? colors.primaryForeground : colors.mutedForeground }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  track: { flexDirection: "row", padding: 4, borderWidth: 1 },
  option: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 38 },
});
