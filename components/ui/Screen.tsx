import { type ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/hooks/useTheme";
import { AuroraBackground } from "./AuroraBackground";
import { Text } from "./Text";

export interface ScreenProps {
  children: ReactNode;
  /** Page title rendered as a large heading. */
  title?: string;
  subtitle?: string;
  /** Right-side slot next to the title. */
  headerRight?: ReactNode;
  /** Wrap in a ScrollView (default true). */
  scroll?: boolean;
  /** Show the aurora backdrop (default true). */
  aurora?: boolean;
  auroraIntensity?: number;
  /** Bottom safe-area is handled by the tab bar on dashboard screens. */
  edges?: ("top" | "bottom")[];
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  /** Horizontally centre content and cap its width (onboarding). */
  centered?: boolean;
}

export function Screen({
  children,
  title,
  subtitle,
  headerRight,
  scroll = true,
  aurora = true,
  auroraIntensity = 0.7,
  edges = ["top"],
  refreshing = false,
  onRefresh,
  contentStyle,
  centered = false,
}: ScreenProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const header =
    title || headerRight ? (
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {title ? <Text variant="h1">{title}</Text> : null}
          {subtitle ? (
            <Text tone="muted" style={{ marginTop: 4 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {headerRight}
      </View>
    ) : null;

  const body = (
    <View
      style={[
        styles.content,
        centered ? styles.centered : null,
        { paddingBottom: edges.includes("bottom") ? 24 : insets.bottom + 96 },
        contentStyle,
      ]}
    >
      {header}
      {children}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {aurora ? <AuroraBackground intensity={auroraIntensity} /> : null}
      <SafeAreaView edges={edges} style={styles.root}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.root}
        >
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={centered ? styles.scrollCentered : undefined}
              refreshControl={
                onRefresh ? (
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                  />
                ) : undefined
              }
            >
              {body}
            </ScrollView>
          ) : (
            body
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, gap: 20 },
  centered: { width: "100%", maxWidth: 480, alignSelf: "center" },
  scrollCentered: { flexGrow: 1, justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 4,
  },
});
