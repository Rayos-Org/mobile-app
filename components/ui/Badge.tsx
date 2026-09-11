import { type ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "./Text";

export type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive" | "primary";

export interface BadgeProps extends ViewProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Leading status dot. */
  dot?: boolean;
}

export function Badge({ children, variant = "default", dot = false, style, ...props }: BadgeProps) {
  const { colors, radius } = useTheme();

  const palette = {
    default: { bg: colors.primary, fg: colors.primaryForeground, border: "transparent" },
    primary: { bg: alpha(colors.primary, 0.12), fg: colors.primary, border: alpha(colors.primary, 0.35) },
    secondary: { bg: colors.secondary, fg: colors.secondaryForeground, border: "transparent" },
    outline: { bg: "transparent", fg: colors.foreground, border: colors.border },
    success: { bg: colors.successSoft, fg: colors.success, border: alpha(colors.success, 0.35) },
    warning: { bg: colors.warningSoft, fg: colors.warning, border: alpha(colors.warning, 0.35) },
    destructive: { bg: colors.destructiveSoft, fg: colors.destructive, border: alpha(colors.destructive, 0.35) },
  }[variant];

  return (
    <View
      {...props}
      style={[
        styles.badge,
        { backgroundColor: palette.bg, borderColor: palette.border, borderRadius: radius.full },
        style,
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: palette.fg }]} /> : null}
      {typeof children === "string" ? (
        <Text variant="small" weight="600" style={{ color: palette.fg, fontSize: 12 }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    height: 26,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
