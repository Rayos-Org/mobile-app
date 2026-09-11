import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { typography } from "@/lib/theme";

type Variant = keyof typeof typography;
type Tone = "default" | "muted" | "primary" | "success" | "warning" | "destructive" | "inverse";

export interface TextProps extends RNTextProps {
  variant?: Variant;
  tone?: Tone;
  align?: TextStyle["textAlign"];
  weight?: TextStyle["fontWeight"];
}

export function Text({
  variant = "body",
  tone = "default",
  align,
  weight,
  style,
  ...props
}: TextProps) {
  const { colors, typography } = useTheme();
  const color = {
    default: colors.foreground,
    muted: colors.mutedForeground,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
    destructive: colors.destructive,
    inverse: colors.primaryForeground,
  }[tone];

  return (
    <RNText
      {...props}
      style={[
        typography[variant],
        { color, textAlign: align },
        weight ? { fontWeight: weight } : null,
        variant === "caption" ? { textTransform: "uppercase" } : null,
        style,
      ]}
    />
  );
}
