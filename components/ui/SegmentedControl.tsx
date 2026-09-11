import { useEffect, useState } from "react";
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { Text } from "./Text";

export interface Segment<T extends string> {
  value: T;
  label: string;
}

/** iOS-style segmented tabs with a sliding indicator (Policies page). */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { colors, radius, isDark } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(
    0,
    segments.findIndex((s) => s.value === value)
  );
  const x = useSharedValue(0);

  const segW = width > 0 ? (width - 8) / segments.length : 0;

  useEffect(() => {
    x.value = withSpring(index * segW, { damping: 22, stiffness: 260 });
  }, [index, segW, x]);

  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[
        styles.track,
        { backgroundColor: colors.muted, borderRadius: radius.xl, borderColor: colors.border },
      ]}
    >
      {segW > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segW,
              backgroundColor: isDark ? colors.elevated : colors.card,
              borderRadius: radius.lg,
              borderColor: colors.border,
            },
            !isDark ? styles.indicatorShadow : null,
            indicator,
          ]}
        />
      ) : null}
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(s.value);
            }}
            style={styles.segment}
          >
            <Text variant="small" weight="600" tone={active ? "default" : "muted"}>
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: "row", padding: 4, height: 46, borderWidth: 1 },
  indicator: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  indicatorShadow: {
    shadowColor: "#0B1220",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  segment: { flex: 1, alignItems: "center", justifyContent: "center" },
});
