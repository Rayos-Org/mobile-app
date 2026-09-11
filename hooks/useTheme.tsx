import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import { secureStorageAdapter as prefs } from "@/lib/storage-adapter";
import { buildTheme, type ColorScheme, type Theme } from "@/lib/theme";

export type ThemePreference = "system" | ColorScheme;

const STORAGE_KEY = "rayos_theme_pref";

interface ThemeContextValue {
  theme: Theme;
  /** What the user picked — defaults to "system". */
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  /** True once the persisted preference has been read. */
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/** Push the override to native so system dialogs / keyboard match. */
function applyNativeScheme(pref: ThemePreference) {
  // Not implemented on react-native-web; RN types the "follow system" value as null.
  if (typeof Appearance.setColorScheme !== "function") return;
  Appearance.setColorScheme((pref === "system" ? null : pref) as any);
}

function isPreference(v: unknown): v is ThemePreference {
  return v === "system" || v === "light" || v === "dark";
}

/**
 * Follows the OS appearance by default. A manual override is persisted and
 * pushed to `Appearance.setColorScheme` so native surfaces (alerts, pickers,
 * keyboard) switch with the app.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    prefs
      .getItem(STORAGE_KEY)
      .then((stored) => {
        if (cancelled) return;
        if (isPreference(stored)) {
          setPreferenceState(stored);
          applyNativeScheme(stored);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    applyNativeScheme(pref);
    prefs.setItem(STORAGE_KEY, pref).catch(() => {});
  }, []);

  const scheme: ColorScheme =
    preference === "system" ? (systemScheme === "dark" ? "dark" : "light") : preference;

  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  // Root view colour behind navigation transitions / keyboard.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background).catch(() => {});
  }, [theme.colors.background]);

  const value = useMemo(
    () => ({ theme, preference, setPreference, ready }),
    [theme, preference, setPreference, ready]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx.theme;
}

export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemePreference must be used inside <ThemeProvider>");
  return { preference: ctx.preference, setPreference: ctx.setPreference, ready: ctx.ready };
}
