import { type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "./Text";

export interface ListRowProps {
  icon?: ReactNode;
  iconTone?: "primary" | "success" | "destructive" | "muted" | "warning";
  title: string;
  subtitle?: string;
  mono?: boolean;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}

/** Edge-to-edge row for lists inside a flush Card (activity, signers, sessions). */
export function ListRow({
  icon,
  iconTone = "primary",
  title,
  subtitle,
  mono,
  right,
  onPress,
  last,
}: ListRowProps) {
  const { colors } = useTheme();
  const toneColor = {
    primary: colors.primary,
    success: colors.success,
    destructive: colors.destructive,
    warning: colors.warning,
    muted: colors.mutedForeground,
  }[iconTone];

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        {
          borderBottomColor: colors.border,
          borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
        },
        pressed ? { backgroundColor: alpha(colors.foreground, 0.04) } : null,
      ]}
    >
      {icon ? (
        <View
          style={[
            styles.icon,
            { backgroundColor: alpha(toneColor, 0.12), borderColor: alpha(toneColor, 0.25) },
          ]}
        >
          {icon}
        </View>
      ) : null}
      <View style={styles.text}>
        <Text
          variant="bodyMedium"
          numberOfLines={1}
          style={mono ? { fontFamily: "monospace", fontSize: 13 } : null}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: { flex: 1, minWidth: 0 },
});
