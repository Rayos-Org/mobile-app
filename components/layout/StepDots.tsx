import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "@/components/ui/Text";

/** Numbered progress indicator for multi-step onboarding flows. */
export function StepDots({ step, total, labels }: { step: number; total: number; labels?: string[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <View key={n} style={styles.item}>
            <View
              style={[
                styles.dot,
                {
                  borderColor: done || active ? colors.primary : alpha(colors.mutedForeground, 0.4),
                  backgroundColor: done ? colors.primary : "transparent",
                },
              ]}
            >
              {done ? (
                <Ionicons name="checkmark" size={14} color={colors.primaryForeground} />
              ) : (
                <Text variant="small" weight="700" style={{ color: active ? colors.primary : colors.mutedForeground }}>
                  {n}
                </Text>
              )}
            </View>
            {labels?.[i] ? (
              <Text variant="small" tone={active ? "default" : "muted"} weight={active ? "600" : "400"}>
                {labels[i]}
              </Text>
            ) : null}
            {n < total ? (
              <View style={[styles.line, { backgroundColor: done ? colors.primary : colors.border }]} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  item: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  line: { width: 22, height: 2, borderRadius: 1 },
});
