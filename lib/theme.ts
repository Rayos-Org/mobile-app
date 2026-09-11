/**
 * Design tokens — kept in lockstep with web-dashboard/app/globals.css so the
 * mobile app reads as the same product. Indigo/violet/cyan brand, layered
 * surfaces (background → card → elevated) so depth works without shadows in dark.
 */

export type ColorScheme = "light" | "dark";

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  elevated: string;
  primary: string;
  primaryForeground: string;
  primarySoft: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  border: string;
  input: string;
  ring: string;
  destructive: string;
  destructiveSoft: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  /** Aurora bloom colours (rgb triplets as hex) */
  glow1: string;
  glow2: string;
  glow3: string;
  /** Tab bar / nav */
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
}

export const lightColors: ThemeColors = {
  background: "#F8FAFC",
  foreground: "#0B1220",
  card: "#FFFFFF",
  cardForeground: "#0B1220",
  elevated: "#FFFFFF",
  primary: "#4F46E5",
  primaryForeground: "#FFFFFF",
  primarySoft: "#EEF2FF",
  secondary: "#F1F5F9",
  secondaryForeground: "#1E293B",
  muted: "#F1F5F9",
  mutedForeground: "#64748B",
  accent: "#EEF2FF",
  accentForeground: "#4338CA",
  border: "#E2E8F0",
  input: "#E2E8F0",
  ring: "#6366F1",
  destructive: "#DC2626",
  destructiveSoft: "#FEE2E2",
  success: "#059669",
  successSoft: "#D1FAE5",
  warning: "#D97706",
  warningSoft: "#FEF3C7",
  glow1: "#4F46E5",
  glow2: "#7C3AED",
  glow3: "#06B6D4",
  tabBar: "rgba(255,255,255,0.92)",
  tabBarBorder: "#E2E8F0",
  tabActive: "#4F46E5",
  tabInactive: "#64748B",
};

export const darkColors: ThemeColors = {
  background: "#070A12",
  foreground: "#E6EAF2",
  card: "#0D1220",
  cardForeground: "#E6EAF2",
  elevated: "#111726",
  primary: "#6D6AF7",
  primaryForeground: "#FFFFFF",
  primarySoft: "#1A1B3D",
  secondary: "#161C2D",
  secondaryForeground: "#E6EAF2",
  muted: "#141A29",
  mutedForeground: "#8B94A8",
  accent: "#1A1B3D",
  accentForeground: "#B4B2FF",
  border: "rgba(255,255,255,0.08)",
  input: "rgba(255,255,255,0.10)",
  ring: "#7C7AFF",
  destructive: "#F87171",
  destructiveSoft: "rgba(248,113,113,0.14)",
  success: "#34D399",
  successSoft: "rgba(52,211,153,0.14)",
  warning: "#FBBF24",
  warningSoft: "rgba(251,191,36,0.14)",
  glow1: "#6366F1",
  glow2: "#8B5CF6",
  glow3: "#22D3EE",
  tabBar: "rgba(10,14,25,0.92)",
  tabBarBorder: "rgba(255,255,255,0.08)",
  tabActive: "#7C7AFF",
  tabInactive: "#8B94A8",
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 28,
  full: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 44, fontWeight: "800" as const, letterSpacing: -1 },
  h1: { fontSize: 30, lineHeight: 36, fontWeight: "800" as const, letterSpacing: -0.6 },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, lineHeight: 22, fontWeight: "600" as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: "400" as const },
  bodyMedium: { fontSize: 15, lineHeight: 22, fontWeight: "500" as const },
  small: { fontSize: 13, lineHeight: 18, fontWeight: "400" as const },
  caption: { fontSize: 11, lineHeight: 14, fontWeight: "600" as const, letterSpacing: 1.2 },
  mono: { fontSize: 13, lineHeight: 18, fontFamily: "monospace" as const },
} as const;

/** Brand gradient used for hero text, CTA banners and the balance card. */
export const brandGradient = ["#6366F1", "#8B5CF6", "#22D3EE"] as const;

export interface Theme {
  scheme: ColorScheme;
  isDark: boolean;
  colors: ThemeColors;
  radius: typeof radius;
  spacing: typeof spacing;
  typography: typeof typography;
}

export function buildTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    isDark: scheme === "dark",
    colors: scheme === "dark" ? darkColors : lightColors,
    radius,
    spacing,
    typography,
  };
}

/** Hex → rgba helper for translucent tints. */
export function alpha(hex: string, a: number): string {
  if (hex.startsWith("rgba")) return hex;
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
