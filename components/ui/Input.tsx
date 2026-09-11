import { forwardRef, useState, type ReactNode } from "react";
import { StyleSheet, TextInput, type TextInputProps, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "./Text";

export interface InputProps extends TextInputProps {
  label?: string;
  hint?: string;
  error?: string;
  mono?: boolean;
  right?: ReactNode;
  left?: ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, hint, error, mono, right, left, style, onFocus, onBlur, editable = true, ...props },
  ref
) {
  const { colors, radius, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.destructive : focused ? colors.ring : colors.border;

  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="small" weight="600" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          {
            borderColor,
            borderRadius: radius.lg,
            backgroundColor: isDark ? alpha("#FFFFFF", 0.05) : colors.card,
            opacity: editable ? 1 : 0.6,
          },
          focused ? { shadowColor: colors.ring, ...styles.focusRing } : null,
        ]}
      >
        {left ? <View style={styles.adornment}>{left}</View> : null}
        <TextInput
          ref={ref}
          editable={editable}
          placeholderTextColor={alpha(colors.mutedForeground, 0.7)}
          selectionColor={colors.primary}
          keyboardAppearance={isDark ? "dark" : "light"}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: colors.foreground },
            mono ? { fontFamily: "monospace", fontSize: 13 } : null,
            style,
          ]}
          {...props}
        />
        {right ? <View style={styles.adornment}>{right}</View> : null}
      </View>
      {error ? (
        <Text variant="small" tone="destructive" style={styles.hint}>
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" tone="muted" style={styles.hint}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { marginBottom: 2 },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    minHeight: 48,
    paddingHorizontal: 14,
  },
  focusRing: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 12 },
  adornment: { justifyContent: "center", alignItems: "center", marginHorizontal: 2 },
  hint: { marginTop: 2 },
});
