import { useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Card, Input, PasskeyPrompt, Text, Screen, useToast } from "@/components/ui";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { StepDots } from "@/components/layout/StepDots";
import { useTheme } from "@/hooks/useTheme";
import { useAuthStore } from "@/store/auth";
import { walletSdk } from "@/lib/sdk-client";
import { getRegistrationOptions, newUserHandle, verifyRegistration } from "@/lib/webauthn";
import { errorMessage } from "@/lib/api";
import { EXPLORER_URL, FRIENDBOT_URL } from "@/lib/config";
import { isPasskeySupported, PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

type Step = 1 | 2 | 3;

/**
 * Wallet creation — identical ceremony to web-dashboard/create:
 *   register/options → SDK.createWallet (native passkey + deploy) → register/verify
 */
export default function CreateWalletScreen() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{
    address: string;
    credentialId: string;
    userHandle: string;
  } | null>(null);

  const handleCreatePasskey = async () => {
    if (!isPasskeySupported()) {
      toast.error(
        "Passkeys unavailable",
        "This device can’t create passkeys. iOS 16+ / Android 9+ required."
      );
      return;
    }
    setProcessing(true);
    try {
      const userHandle = newUserHandle();
      const options = await getRegistrationOptions(userHandle, name.trim());

      const salt = new Uint8Array(32);
      Crypto.getRandomValues(salt);
      const { address, credential } = await walletSdk.createWallet(options, salt);

      const verify = await verifyRegistration(userHandle, credential);
      if (!verify.verified) throw new Error("The relay could not verify your passkey.");

      setResult({ address, credentialId: verify.credentialId ?? credential.id, userHandle });
      setStep(3);
      toast.success("Wallet deployed", "Your passkey-secured wallet is live on testnet.");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError)) {
        toast.error("Couldn’t create wallet", errorMessage(err));
      }
    } finally {
      setProcessing(false);
    }
  };

  const finish = () => {
    if (!result) return;
    setAuth({
      walletAddress: result.address,
      credentialId: result.credentialId,
      userHandle: result.userHandle,
      walletName: name.trim(),
    });
  };

  return (
    <Screen edges={["top", "bottom"]} centered>
      <OnboardingHeader />
      <StepDots step={step} total={3} labels={["Name", "Passkey", "Done"]} />

      <Card glass>
        {step === 1 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stack}>
            <Text variant="h1">Create your Guardian Wallet</Text>
            <Text tone="muted">
              Passkeys secure your wallet. No seed phrases, no passwords — nothing to write down.
            </Text>
            <Input
              testID="display-name-input"
              label="Wallet name"
              placeholder="e.g. Personal"
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => name.trim() && setStep(2)}
              hint="Only used to label your passkey on this device."
            />
            <Button
              size="lg"
              fullWidth
              disabled={!name.trim()}
              onPress={() => setStep(2)}
              iconRight={
                <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
              }
            >
              Continue
            </Button>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.stack}>
            <Text variant="h1">Create passkey</Text>
            <Text tone="muted">
              Your device will ask for Face ID, Touch ID or your fingerprint. The private key never
              leaves the secure enclave.
            </Text>
            <PasskeyPrompt
              processing={processing}
              message={
                processing ? "Waiting for your device…" : "Tap below to register your passkey"
              }
            />
            <Button
              size="lg"
              fullWidth
              testID="create-passkey"
              loading={processing}
              onPress={handleCreatePasskey}
              icon={<Ionicons name="finger-print" size={20} color={colors.primaryForeground} />}
            >
              Create Passkey
            </Button>
            <Button variant="ghost" fullWidth disabled={processing} onPress={() => setStep(1)}>
              Back
            </Button>
          </Animated.View>
        )}

        {step === 3 && result && (
          <Animated.View entering={FadeIn} style={styles.stack}>
            <View style={styles.doneHeader}>
              <View
                style={[
                  styles.checkDisc,
                  { backgroundColor: colors.successSoft, borderColor: alpha(colors.success, 0.35) },
                ]}
              >
                <Ionicons name="checkmark" size={26} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h1">Wallet deployed</Text>
                <Text tone="muted" variant="small">
                  Live on Stellar Testnet
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.addressBox,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Text variant="caption" tone="muted">
                Your wallet address
              </Text>
              <Text variant="mono" selectable style={{ marginTop: 6 }}>
                {result.address}
              </Text>
              <View style={styles.addressActions}>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Ionicons name="copy-outline" size={14} color={colors.foreground} />}
                  onPress={async () => {
                    await Clipboard.setStringAsync(result.address);
                    toast.success("Address copied");
                  }}
                >
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Ionicons name="open-outline" size={14} color={colors.mutedForeground} />}
                  onPress={() => Linking.openURL(`${EXPLORER_URL}/account/${result.address}`)}
                >
                  Explorer
                </Button>
              </View>
            </View>

            <View
              style={[
                styles.note,
                {
                  backgroundColor: colors.warningSoft,
                  borderColor: alpha(colors.warning, 0.35),
                  borderRadius: radius.lg,
                },
              ]}
            >
              <Ionicons name="water-outline" size={18} color={colors.warning} />
              <View style={{ flex: 1 }}>
                <Text variant="small">
                  Fund your wallet with testnet XLM from Friendbot to activate it.
                </Text>
                <Button
                  size="sm"
                  variant="ghost"
                  style={{ marginTop: 4, marginLeft: -12 }}
                  onPress={() => Linking.openURL(`${FRIENDBOT_URL}?addr=${result.address}`)}
                >
                  Open Friendbot →
                </Button>
              </View>
            </View>

            <Badge variant="success" dot>
              Passkey verified
            </Badge>

            <Button
              size="lg"
              fullWidth
              testID="go-dashboard"
              onPress={finish}
              iconRight={
                <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
              }
            >
              Go to Dashboard
            </Button>
          </Animated.View>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  doneHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  checkDisc: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  addressBox: { padding: 14, borderWidth: 1 },
  addressActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  note: { flexDirection: "row", gap: 10, padding: 12, borderWidth: 1, alignItems: "flex-start" },
});
