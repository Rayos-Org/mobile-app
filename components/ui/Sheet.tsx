import { type ReactNode, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { Text } from "./Text";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** Footer slot pinned under the scrollable body. */
  footer?: ReactNode;
  /** Prevent dismiss while an operation is in flight. */
  dismissable?: boolean;
}

/** Bottom sheet built on Modal — no native dependency, works in Expo Go. */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissable = true,
}: SheetProps) {
  const { colors, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(open ? 1 : 0, {
      duration: 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [open, progress]);

  const backdrop = useAnimatedStyle(() => ({ opacity: progress.value }));
  const panel = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * 60 }],
    opacity: progress.value,
  }));

  const tryClose = () => {
    if (dismissable) onClose();
  };

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onRequestClose={tryClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, backdrop]}>
          <Pressable
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(11,18,32,0.45)" },
            ]}
            onPress={tryClose}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <Animated.View
            style={[
              styles.panel,
              {
                backgroundColor: colors.elevated,
                borderTopLeftRadius: radius["3xl"],
                borderTopRightRadius: radius["3xl"],
                borderColor: colors.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
              panel,
            ]}
          >
            <View style={[styles.grabber, { backgroundColor: colors.border }]} />
            {title ? (
              <View style={styles.header}>
                <View style={{ flex: 1 }}>
                  <Text variant="h2">{title}</Text>
                  {description ? (
                    <Text variant="small" tone="muted" style={{ marginTop: 4 }}>
                      {description}
                    </Text>
                  ) : null}
                </View>
                {dismissable ? (
                  <Pressable
                    onPress={onClose}
                    hitSlop={8}
                    accessibilityLabel="Close"
                    style={[styles.close, { backgroundColor: colors.muted }]}
                  >
                    <Ionicons name="close" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
              style={{ maxHeight: 520 }}
            >
              {children}
            </ScrollView>
            {footer ? <View style={styles.footer}>{footer}</View> : null}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  kav: { justifyContent: "flex-end" },
  panel: { paddingHorizontal: 20, paddingTop: 10, borderWidth: StyleSheet.hairlineWidth },
  grabber: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 14 },
  header: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  close: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { gap: 16, paddingBottom: 8 },
  footer: { marginTop: 12, gap: 10 },
});
