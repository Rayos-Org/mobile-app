import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";

/**
 * Ambient product backdrop — three slow-drifting colour blooms that re-tint
 * with the theme. Mirrors AuroraBackground on the web dashboard.
 */
export function AuroraBackground({ intensity = 1 }: { intensity?: number }) {
  const { colors, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(1, { duration: 16000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [t]);

  const size = Math.max(width, height) * 0.9;
  const a = (isDark ? 0.26 : 0.18) * intensity;

  const bloom1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: -size * 0.35 + t.value * size * 0.18 },
      { translateY: -size * 0.45 + t.value * size * 0.08 },
      { scale: 1 + t.value * 0.12 },
    ],
  }));
  const bloom2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: width - size * 0.55 - t.value * size * 0.12 },
      { translateY: -size * 0.2 + t.value * size * 0.14 },
      { scale: 1.05 - t.value * 0.1 },
    ],
  }));
  const bloom3 = useAnimatedStyle(() => ({
    transform: [
      { translateX: width * 0.25 + t.value * size * 0.1 },
      { translateY: height - size * 0.55 - t.value * size * 0.1 },
      { scale: 0.95 + t.value * 0.08 },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Bloom color={colors.glow1} size={size} opacity={a} style={bloom1} />
      <Bloom color={colors.glow2} size={size} opacity={a * 0.85} style={bloom2} />
      <Bloom color={colors.glow3} size={size * 0.8} opacity={a * 0.7} style={bloom3} />
    </View>
  );
}

function Bloom({
  color,
  size,
  opacity,
  style,
}: {
  color: string;
  size: number;
  opacity: number;
  style: any;
}) {
  // Many concentric translucent discs with a quadratic falloff approximate a
  // radial blur without pulling in Skia. Each step is faint enough to be seamless.
  const STEPS = 14;
  const rings = Array.from({ length: STEPS }, (_, i) => 1 - i / STEPS);
  return (
    <Animated.View
      style={[{ position: "absolute", width: size, height: size, alignItems: "center", justifyContent: "center" }, style]}
    >
      {rings.map((r, i) => (
        <View
          key={r}
          style={{
            position: "absolute",
            width: size * r,
            height: size * r,
            borderRadius: (size * r) / 2,
            backgroundColor: alpha(color, (opacity * 1.6) / STEPS * (1 + (i / STEPS) ** 2)),
          }}
        />
      ))}
    </Animated.View>
  );
}
