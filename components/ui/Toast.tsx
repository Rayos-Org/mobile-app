import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/useTheme";
import { Text } from "./Text";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  description?: string;
}

interface ToastApi {
  show: (kind: ToastKind, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

let nextId = 1;

/** Sonner-style stacked toasts anchored under the status bar. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
  }, []);

  const show = useCallback(
    (kind: ToastKind, title: string, description?: string) => {
      const id = nextId++;
      setItems((prev) => [...prev.slice(-2), { id, kind, title, description }]);
      timers.current.set(id, setTimeout(() => dismiss(id), kind === "error" ? 5000 : 3200));
      const fb =
        kind === "success"
          ? Haptics.NotificationFeedbackType.Success
          : kind === "error"
            ? Haptics.NotificationFeedbackType.Error
            : Haptics.NotificationFeedbackType.Warning;
      Haptics.notificationAsync(fb).catch(() => {});
    },
    [dismiss]
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (t, d) => show("success", t, d),
      error: (t, d) => show("error", t, d),
      info: (t, d) => show("info", t, d),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastHost items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastHost({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  const { colors, radius, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  if (items.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      {items.map((t) => {
        const tone =
          t.kind === "success" ? colors.success : t.kind === "error" ? colors.destructive : colors.primary;
        const icon = t.kind === "success" ? "checkmark-circle" : t.kind === "error" ? "close-circle" : "information-circle";
        return (
          <Animated.View
            key={t.id}
            entering={FadeInUp.springify().damping(18)}
            exiting={FadeOutUp.duration(180)}
            layout={LinearTransition.springify()}
            onTouchEnd={() => onDismiss(t.id)}
            style={[
              styles.toast,
              {
                backgroundColor: colors.elevated,
                borderColor: colors.border,
                borderRadius: radius.xl,
                shadowColor: isDark ? "#000" : "#0B1220",
              },
            ]}
          >
            <Ionicons name={icon} size={20} color={tone} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{t.title}</Text>
              {t.description ? (
                <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
                  {t.description}
                </Text>
              ) : null}
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const styles = StyleSheet.create({
  host: { position: "absolute", left: 16, right: 16, gap: 8, zIndex: 100 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});
