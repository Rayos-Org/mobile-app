import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Button, Card, PasskeyPrompt, Screen, Text, useToast } from "@/components/ui";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth";
import { assertWithPasskey, lookupWallet, newUserHandle } from "@/lib/webauthn";
import { errorMessage } from "@/lib/api";
import { isPasskeySupported, PasskeyCancelledError } from "@/native/passkey-adapter";

/**
 * Sign in — assert/options → native passkey picker → /wallets/:credentialId.
 * Discoverable credentials mean returning users don't type anything.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const toast = useToast();
  const { setAuth, userHandle: storedHandle, walletName } = useAuthStore();
  const [processing, setProcessing] = useState(false);

  const handleLogin = async () => {
    if (!isPasskeySupported()) {
      toast.error("Passkeys unavailable", "This device can’t use passkeys.");
      return;
    }
    setProcessing(true);
    try {
      // The relay scopes challenges by userHandle; reuse the one from registration
      // when we have it, otherwise any unique handle works for discoverable sign-in.
      const handle = storedHandle ?? newUserHandle();
      const { assertion } = await assertWithPasskey(handle, undefined, "login");
      const { walletAddress } = await lookupWallet(assertion.id);
      setAuth({ walletAddress, credentialId: assertion.id, userHandle: handle });
      toast.success("Welcome back");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError)) {
        toast.error("Sign in failed", errorMessage(err, "No wallet found for this passkey."));
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Screen edges={["top", "bottom"]} centered>
      <OnboardingHeader />
      <Card glass>
        <View style={styles.stack}>
          <Text variant="h1">{walletName ? `Welcome back, ${walletName}` : "Welcome back"}</Text>
          <Text tone="muted">Access your Guardian Wallet with the passkey on this device.</Text>
          <PasskeyPrompt
            processing={processing}
            message={processing ? "Waiting for your device…" : "Ready to authenticate"}
          />
          <Button
            size="lg"
            fullWidth
            testID="login-passkey"
            loading={processing}
            onPress={handleLogin}
            icon={<Ionicons name="finger-print" size={20} color={colors.primaryForeground} />}
          >
            Sign in with Passkey
          </Button>
          <Button
            variant="ghost"
            fullWidth
            disabled={processing}
            onPress={() => router.replace("/create")}
          >
            Create a new wallet instead
          </Button>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ stack: { gap: 16 } });
