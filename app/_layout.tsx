import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme, useThemePreference } from "@/hooks/useTheme";
import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/store/auth";
import { ToastProvider } from "@/components/ui/Toast";

// Keep the native splash up until auth + theme preference have loaded so the
// first frame is already the right screen in the right colour scheme.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 350, fade: true });

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <RootNavigator />
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { colors } = useTheme();
  const { ready: themeReady } = useThemePreference();
  const walletAddress = useAuthStore((s) => s.walletAddress);
  const hydrated = useAuthStore((s) => s.hydrated);
  const signedIn = !!walletAddress;
  // Icon glyphs are used on every screen; load them before the first frame.
  const [fontsLoaded, fontError] = useFonts(Ionicons.font);
  const ready = hydrated && themeReady && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "fade_from_bottom",
      }}
    >
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(dashboard)" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      {/* Guardian approval — reachable from a deep link whether or not signed in. */}
      <Stack.Screen name="recovery/[proposalId]" options={{ presentation: "modal" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}
