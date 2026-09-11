import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { alpha } from "@/lib/theme";
import { Text } from "./Text";

// Separate light/dark assets — swap the files in /assets, names stay the same.
const LOGO_LIGHT = require("@/assets/logo.png");
const LOGO_DARK = require("@/assets/logo-dark.png");

export function Logo({
  size = 36,
  wordmark = false,
  glow = true,
}: {
  size?: number;
  wordmark?: boolean;
  glow?: boolean;
}) {
  const { isDark, colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ width: size, height: size }}>
        {glow ? (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: size / 3,
                backgroundColor: alpha(colors.primary, 0.35),
                transform: [{ scale: 1.15 }],
              },
            ]}
          />
        ) : null}
        <Image
          source={isDark ? LOGO_DARK : LOGO_LIGHT}
          style={{ width: size, height: size, borderRadius: size / 3.2 }}
          contentFit="cover"
          accessibilityLabel="Guardian Wallet"
        />
      </View>
      {wordmark ? (
        <Text variant="h3" weight="700" style={{ fontSize: size * 0.5 }}>
          Guardian
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ row: { flexDirection: "row", alignItems: "center", gap: 10 } });
