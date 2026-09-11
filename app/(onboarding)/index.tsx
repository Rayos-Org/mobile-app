import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Logo, Screen, Text } from "@/components/ui";
import { ThemeSwitch } from "@/components/layout/ThemeSwitch";
import { useTheme } from "@/hooks/useTheme";
import { alpha, brandGradient } from "@/lib/theme";

const highlights = [
  { icon: "finger-print", title: "Passkey secured", text: "Face ID or fingerprint. No seed phrase, ever." },
  { icon: "shield-checkmark", title: "On-chain policies", text: "Spend limits enforced by the contract." },
  { icon: "people", title: "Social recovery", text: "Guardians restore access if you lose your device." },
] as const;

/** Landing — mirrors the web-dashboard hero. */
export default function WelcomeScreen() {
  const router = useRouter();
  const { colors, radius } = useTheme();

  return (
    <Screen edges={["top", "bottom"]} auroraIntensity={1} centered>
      <View style={styles.topBar}>
        <Logo size={36} wordmark />
        <ThemeSwitch compact />
      </View>

      <Animated.View entering={FadeInDown.delay(80).springify().damping(18)} style={styles.hero}>
        <Badge variant="primary" dot>
          Live on Stellar Testnet
        </Badge>
        <View style={{ marginTop: 18 }}>
          <Text variant="display">Your wallet,</Text>
          <Text variant="display">secured by</Text>
          <GradientText>biometrics.</GradientText>
        </View>
        <Text tone="muted" style={{ marginTop: 14, maxWidth: 340 }}>
          A passkey-powered Stellar smart wallet. No seed phrases, no passwords — just you,
          with on-chain spend policies and guardian recovery built in.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(220).springify().damping(18)} style={styles.actions}>
        <Button
          size="lg"
          fullWidth
          testID="cta-create"
          icon={<Ionicons name="finger-print" size={20} color={colors.primaryForeground} />}
          onPress={() => router.push("/create")}
        >
          Create Wallet — Free
        </Button>
        <Button
          size="lg"
          fullWidth
          variant="outline"
          testID="cta-login"
          icon={<Ionicons name="lock-closed-outline" size={18} color={colors.foreground} />}
          onPress={() => router.push("/login")}
        >
          Sign In
        </Button>
        <Button variant="ghost" fullWidth onPress={() => router.push("/recover")}>
          Lost your device? Recover your wallet →
        </Button>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(360).springify().damping(18)} style={styles.grid}>
        {highlights.map((h) => (
          <View
            key={h.title}
            style={[
              styles.tile,
              { backgroundColor: alpha(colors.card, 0.7), borderColor: colors.border, borderRadius: radius.xl },
            ]}
          >
            <LinearGradient
              colors={[brandGradient[0], brandGradient[2]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.tileIcon, { borderRadius: radius.md }]}
            >
              <Ionicons name={h.icon} size={18} color="#fff" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">{h.title}</Text>
              <Text variant="small" tone="muted">
                {h.text}
              </Text>
            </View>
          </View>
        ))}
      </Animated.View>

      <View style={styles.footer}>
        {["Non-custodial", "Open source", "No seed phrases"].map((t) => (
          <View key={t} style={styles.footerItem}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text variant="small" tone="muted">
              {t}
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

/** Brand-gradient headline — same gradient as `.text-gradient` on the web. */
function GradientText({ children }: { children: string }) {
  const { typography } = useTheme();
  return (
    <MaskedView
      maskElement={
        <Text variant="display" style={{ backgroundColor: "transparent" }}>
          {children}
        </Text>
      }
    >
      <LinearGradient
        colors={[...brandGradient]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ height: typography.display.lineHeight + 4 }}
      >
        <Text variant="display" style={{ opacity: 0 }}>
          {children}
        </Text>
      </LinearGradient>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  hero: { marginTop: 24 },
  actions: { gap: 10, marginTop: 8 },
  grid: { gap: 10, marginTop: 8 },
  tile: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderWidth: 1 },
  tileIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  footer: { flexDirection: "row", flexWrap: "wrap", gap: 14, justifyContent: "center", marginTop: 8 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 5 },
});
