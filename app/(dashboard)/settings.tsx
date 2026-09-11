import { Alert, Linking, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Card, CardHeader, ListRow, Logo, Screen, Text, useToast } from "@/components/ui";
import { ThemeSwitch } from "@/components/layout/ThemeSwitch";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth";
import { config, EXPLORER_URL } from "@/lib/config";
import { shortAddress } from "@/lib/format";

const GITHUB = "https://github.com/Rayos-Org/mobile-app";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const toast = useToast();
  const { walletAddress, walletName, credentialId, clearAuth } = useAuthStore();

  const signOut = () =>
    Alert.alert("Sign out?", "Your passkey stays on this device — you can sign back in with one tap.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: clearAuth },
    ]);

  return (
    <Screen title="Settings" subtitle="Appearance, wallet and about">
      <Card>
        <CardHeader
          title="Appearance"
          description="Follows your system setting by default."
          icon={<Ionicons name="color-palette-outline" size={18} color={colors.primary} />}
        />
        <ThemeSwitch />
      </Card>

      <Card flush>
        <CardHeader
          title="Wallet"
          icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
          style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 6 }}
          action={
            <Badge variant="success" dot>
              Testnet
            </Badge>
          }
        />
        <ListRow
          icon={<Ionicons name="person-outline" size={16} color={colors.primary} />}
          title={walletName ?? "Guardian Wallet"}
          subtitle="Wallet name"
        />
        <ListRow
          icon={<Ionicons name="location-outline" size={16} color={colors.primary} />}
          title={shortAddress(walletAddress, 10, 8)}
          mono
          subtitle="Tap to copy address"
          onPress={async () => {
            await Clipboard.setStringAsync(walletAddress ?? "");
            toast.success("Address copied");
          }}
          right={<Ionicons name="copy-outline" size={16} color={colors.mutedForeground} />}
        />
        <ListRow
          icon={<Ionicons name="finger-print" size={16} color={colors.primary} />}
          title={shortAddress(credentialId, 10, 6)}
          mono
          subtitle="Passkey credential"
        />
        <ListRow
          icon={<Ionicons name="open-outline" size={16} color={colors.primary} />}
          title="View on Stellar Expert"
          subtitle="Explorer"
          last
          onPress={() => Linking.openURL(`${EXPLORER_URL}/account/${walletAddress}`)}
          right={<Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
        />
      </Card>

      <Card flush>
        <CardHeader
          title="Network"
          icon={<Ionicons name="git-network-outline" size={18} color={colors.primary} />}
          style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 6 }}
        />
        <ListRow icon={<Ionicons name="server-outline" size={16} color={colors.primary} />} title={hostOf(config.RELAY_BACKEND_URL)} subtitle="Relay backend" mono />
        <ListRow icon={<Ionicons name="planet-outline" size={16} color={colors.primary} />} title={hostOf(config.SOROBAN_RPC_URL)} subtitle="Soroban RPC" mono />
        <ListRow
          icon={<Ionicons name="cube-outline" size={16} color={colors.primary} />}
          title={shortAddress(config.FACTORY_CONTRACT_ID, 8, 6)}
          subtitle="Factory contract"
          mono
          last
        />
      </Card>

      <Card flush>
        <CardHeader
          title="About"
          icon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}
          style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 6 }}
        />
        <ListRow
          icon={<Ionicons name="logo-github" size={16} color={colors.primary} />}
          title="Source on GitHub"
          subtitle="Rayos-Org/mobile-app · MIT"
          onPress={() => Linking.openURL(GITHUB)}
          right={<Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
        />
        <ListRow
          icon={<Ionicons name="bug-outline" size={16} color={colors.primary} />}
          title="Report a bug"
          onPress={() => Linking.openURL(`${GITHUB}/issues/new/choose`)}
          right={<Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />}
        />
        <ListRow
          icon={<Ionicons name="pricetag-outline" size={16} color={colors.primary} />}
          title={`v${Constants.expoConfig?.version ?? "1.0.0"}`}
          subtitle="App version"
          last
        />
      </Card>

      <Button variant="destructive" fullWidth size="lg" onPress={signOut} icon={<Ionicons name="log-out-outline" size={18} color={colors.destructive} />} testID="sign-out">
        Sign out
      </Button>

      <View style={styles.footer}>
        <Logo size={22} glow={false} />
        <Text variant="small" tone="muted">
          Guardian Wallet by Rayos Org
        </Text>
      </View>
    </Screen>
  );
}

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const styles = StyleSheet.create({
  footer: { alignItems: "center", gap: 8, paddingVertical: 8 },
});
