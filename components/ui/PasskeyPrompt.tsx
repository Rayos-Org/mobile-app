import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "./Text";

/** Fingerprint hero shown while a WebAuthn ceremony is in flight. */
export function PasskeyPrompt({
  processing,
  message = "Follow the prompt from your device…",
}: {
  processing: boolean;
  message?: string;
}) {
  const { colors, radius } = useTheme();
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = processing
      ? withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false)
      : withTiming(0, { duration: 200 });
  }, [processing, pulse]);

  const ring1 = useAnimatedStyle(() => ({
    opacity: (1 - pulse.value) * 0.7,
    transform: [{ scale: 0.75 + pulse.value * 0.7 }],
  }));
  const ring2 = useAnimatedStyle(() => ({
    opacity: (1 - ((pulse.value + 0.5) % 1)) * 0.7,
    transform: [{ scale: 0.75 + ((pulse.value + 0.5) % 1) * 0.7 }],
  }));

  return (
    <View style={[styles.wrap, { borderColor: colors.border, borderRadius: radius["2xl"], backgroundColor: alpha(colors.muted, 0.6) }]}>
      <View style={styles.stage}>
        {processing ? (
          <>
            <Animated.View style={[styles.ring, { borderColor: alpha(colors.primary, 0.6) }, ring1]} />
            <Animated.View style={[styles.ring, { borderColor: alpha(colors.primary, 0.6) }, ring2]} />
          </>
        ) : null}
        <View style={[styles.disc, { backgroundColor: alpha(colors.primary, 0.12), borderColor: alpha(colors.primary, 0.3) }]}>
          <Ionicons name="finger-print" size={40} color={colors.primary} />
        </View>
      </View>
      <Text variant="small" tone="muted" align="center" weight="500">
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", padding: 28, gap: 18, borderWidth: 1.5 },
  stage: { width: 110, height: 110, alignItems: "center", justifyContent: "center" },
  ring: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 1.5 },
  disc: { width: 84, height: 84, borderRadius: 42, alignItems: "center", justifyContent: "center", borderWidth: 1 },
});
