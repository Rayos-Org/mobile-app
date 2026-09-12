import type { ConfigContext, ExpoConfig } from "expo/config";

/**
 * Guardian Wallet — Expo config.
 *
 * Values that differ per environment come from env vars so the same config
 * serves local dev, EAS preview and production:
 *
 *   EAS_PROJECT_ID         set by `eas init` (or in CI via secrets)
 *   EXPO_OWNER             Expo account / org that owns the project
 *   APP_ENV                development | preview | production (set in eas.json)
 *   PASSKEY_DOMAIN         host that serves /.well-known/apple-app-site-association
 *                          and /.well-known/assetlinks.json (the relay-backend)
 */

const APP_ENV = process.env.APP_ENV || "development";
const IS_PROD = APP_ENV === "production";
const PASSKEY_DOMAIN = process.env.PASSKEY_DOMAIN || "rayos-relay-backend.onrender.com";
// EAS project (rayos-organization/rayos-wallet). Baked in so EAS Build servers and
// CI resolve the same project without needing the env var; env still overrides.
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID || "c1ea1573-82ba-4aea-aa37-5660edb98163";
const EXPO_OWNER = process.env.EXPO_OWNER || "rayos-organization";

// Brand colours — keep in sync with lib/theme.ts
const LIGHT_BG = "#F8FAFC";
const DARK_BG = "#070A12";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PROD ? "Guardian Wallet" : `Guardian (${APP_ENV})`,
  slug: "rayos-wallet",
  scheme: "rayos",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  backgroundColor: LIGHT_BG,
  owner: EXPO_OWNER,
  extra: { eas: { projectId: EAS_PROJECT_ID } },
  updates: { url: `https://u.expo.dev/${EAS_PROJECT_ID}` },
  runtimeVersion: { policy: "appVersion" },

  ios: {
    supportsTablet: false,
    bundleIdentifier: IS_PROD ? "dev.rayos.wallet" : `dev.rayos.wallet.${APP_ENV}`,
    icon: {
      light: "./assets/icon.png",
      dark: "./assets/icon-dark.png",
      tinted: "./assets/icon-tinted.png",
    },
    associatedDomains: [`applinks:${PASSKEY_DOMAIN}`, `webcredentials:${PASSKEY_DOMAIN}`],
    infoPlist: {
      NSFaceIDUsageDescription:
        "Guardian Wallet uses Face ID to sign transactions with your passkey.",
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: IS_PROD ? "dev.rayos.wallet" : `dev.rayos.wallet.${APP_ENV}`,
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundImage: "./assets/adaptive-icon-background.png",
      monochromeImage: "./assets/adaptive-icon-monochrome.png",
      backgroundColor: LIGHT_BG,
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: PASSKEY_DOMAIN, pathPrefix: "/recovery" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },

  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    output: "single",
  },

  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: LIGHT_BG,
        dark: {
          image: "./assets/splash-icon-dark.png",
          backgroundColor: DARK_BG,
        },
      },
    ],
    "expo-secure-store",
    "expo-font",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/adaptive-icon-monochrome.png",
        color: "#4F46E5",
      },
    ],
    [
      "expo-build-properties",
      {
        ios: { deploymentTarget: "16.4" },
        android: { minSdkVersion: 28 },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },
});
