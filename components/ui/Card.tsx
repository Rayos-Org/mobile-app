import { type ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Text } from "./Text";

export interface CardProps extends ViewProps {
  children?: ReactNode;
  /** Remove inner padding (for lists that need edge-to-edge rows). */
  flush?: boolean;
  /** Translucent glass surface used on top of the aurora background. */
  glass?: boolean;
}

export function Card({ children, flush = false, glass = false, style, ...props }: CardProps) {
  const { colors, radius, isDark } = useTheme();
  return (
    <View
      {...props}
      style={[
        styles.card,
        {
          backgroundColor: glass
            ? isDark
              ? "rgba(13,18,32,0.78)"
              : "rgba(255,255,255,0.82)"
            : colors.card,
          borderColor: colors.border,
          borderRadius: radius["2xl"],
          padding: flush ? 0 : 20,
        },
        !isDark ? styles.lightShadow : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  style,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  style?: ViewProps["style"];
}) {
  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerText}>
        <View style={styles.titleRow}>
          {icon}
          <Text variant="h3">{title}</Text>
        </View>
        {description ? (
          <Text variant="small" tone="muted" style={{ marginTop: 3 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: "hidden",
  },
  lightShadow: {
    shadowColor: "#0B1220",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  headerText: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
});
