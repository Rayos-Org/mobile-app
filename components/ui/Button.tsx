import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "./Text";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

const HEIGHTS: Record<ButtonSize, number> = { sm: 36, md: 44, lg: 52 };
const PADDING: Record<ButtonSize, number> = { sm: 14, md: 18, lg: 22 };

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  disabled,
  icon,
  iconRight,
  style,
  haptic = true,
  onPress,
  ...props
}: ButtonProps) {
  const { colors, radius, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const isDisabled = disabled || loading;

  const palette = {
    primary: {
      bg: colors.primary,
      fg: colors.primaryForeground,
      border: "transparent",
    },
    secondary: {
      bg: colors.secondary,
      fg: colors.secondaryForeground,
      border: "transparent",
    },
    outline: {
      bg: isDark ? alpha("#FFFFFF", 0.04) : colors.card,
      fg: colors.foreground,
      border: colors.border,
    },
    ghost: { bg: "transparent", fg: colors.mutedForeground, border: "transparent" },
    destructive: {
      bg: colors.destructiveSoft,
      fg: colors.destructive,
      border: "transparent",
    },
  }[variant];

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={() => {
        scale.set(withSpring(0.97, { damping: 18, stiffness: 320 }));
      }}
      onPressOut={() => {
        scale.set(withSpring(1, { damping: 18, stiffness: 320 }));
      }}
      onPress={(e) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.(e);
      }}
      style={[
        styles.base,
        {
          height: HEIGHTS[size],
          paddingHorizontal: PADDING[size],
          borderRadius: size === "lg" ? radius.xl : radius.lg,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          opacity: isDisabled ? 0.55 : 1,
          alignSelf: fullWidth ? "stretch" : "flex-start",
        },
        variant === "primary" && !isDisabled ? styles.primaryShadow : null,
        variant === "primary" && !isDisabled ? { shadowColor: colors.primary } : null,
        animStyle,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} size="small" />
      ) : (
        <View style={styles.row}>
          {icon}
          {typeof children === "string" ? (
            <Text
              variant={size === "sm" ? "small" : "bodyMedium"}
              weight="600"
              style={{ color: palette.fg, fontSize: size === "lg" ? 16 : undefined }}
            >
              {children}
            </Text>
          ) : (
            children
          )}
          {iconRight}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth * 2,
    flexDirection: "row",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  primaryShadow: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
});
