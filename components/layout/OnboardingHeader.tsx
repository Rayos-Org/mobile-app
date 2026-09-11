import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Logo } from "@/components/ui/Logo";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { ThemeSwitch } from "./ThemeSwitch";

/** Back · logo · theme toggle row used by create / login / recover. */
export function OnboardingHeader({ backTo }: { backTo?: string }) {
  const router = useRouter();
  const { colors, radius } = useTheme();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() =>
          router.canGoBack() ? router.back() : router.replace((backTo ?? "/") as any)
        }
        style={({ pressed }) => [
          styles.back,
          {
            borderColor: colors.border,
            backgroundColor: alpha(colors.card, 0.7),
            borderRadius: radius.lg,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Ionicons name="arrow-back" size={18} color={colors.foreground} />
      </Pressable>
      <Logo size={32} wordmark />
      <ThemeSwitch compact />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
