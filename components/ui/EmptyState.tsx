import { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Text } from "./Text";

export function EmptyState({
  icon,
  title,
  description,
  action,
  dashed = true,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  dashed?: boolean;
}) {
  const { colors, radius } = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        { borderColor: colors.border, borderRadius: radius.xl, borderStyle: dashed ? "dashed" : "solid" },
      ]}
    >
      {icon ? (
        <View style={[styles.icon, { backgroundColor: colors.muted }]}>{icon}</View>
      ) : null}
      <Text variant="bodyMedium" align="center">
        {title}
      </Text>
      {description ? (
        <Text variant="small" tone="muted" align="center" style={{ marginTop: 4, maxWidth: 280 }}>
          {description}
        </Text>
      ) : null}
      {action ? <View style={{ marginTop: 16 }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 36, paddingHorizontal: 20, borderWidth: 1.5 },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", marginBottom: 14 },
});
