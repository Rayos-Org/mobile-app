import { useState } from "react";
import { Share, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import {
  Badge,
  Button,
  Card,
  Input,
  PasskeyPrompt,
  Screen,
  Separator,
  Text,
  useToast,
} from "@/components/ui";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { StepDots } from "@/components/layout/StepDots";
import { useTheme } from "@/hooks/useTheme";
import { useProposeRecovery, useRecoveryProposal } from "@/hooks/useRecovery";
import { getRegistrationOptions, newUserHandle, verifyRegistration } from "@/lib/webauthn";
import { createCredential, PasskeyCancelledError } from "@/native/passkey-adapter";
import { errorMessage } from "@/lib/api";
import { isStellarAddress } from "@/lib/format";
import { config } from "@/lib/config";
import { alpha } from "@/lib/theme";

type Step = 1 | 2 | 3;

/**
 * Lost-device recovery: create a NEW passkey here, propose it as the wallet's
 * signer, then share the approval link with guardians. Same as web /recover.
 */
export default function RecoverScreen() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const [step, setStep] = useState<Step>(1);
  const [walletAddress, setWalletAddress] = useState("");
  const [processing, setProcessing] = useState(false);
  const [proposalId, setProposalId] = useState("");

  const propose = useProposeRecovery();
  const { data: status, isLoading: statusLoading } = useRecoveryProposal(
    step === 3 ? proposalId : null
  );

  const addressValid = isStellarAddress(walletAddress);

  const start = async () => {
    const addr = walletAddress.trim();
    setProcessing(true);
    setStep(2);
    try {
      const userHandle = newUserHandle();
      const options = await getRegistrationOptions(
        userHandle,
        `Recovery key · ${addr.slice(0, 6)}`
      );
      const credential = await createCredential(options);
      await verifyRegistration(userHandle, credential);

      const res = await propose.mutateAsync({ walletAddress: addr, newSigner: credential.id });
      setProposalId(res.proposalId ?? res.id ?? "");
      setStep(3);
      toast.success("Recovery proposed", "Share the link with your guardians.");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError))
        toast.error("Recovery failed", errorMessage(err));
      setStep(1);
    } finally {
      setProcessing(false);
    }
  };

  // Universal link handled by app.config.ts intentFilters / associatedDomains.
  const shareLink = proposalId ? `https://${config.WEBAUTHN_RP_ID}/recovery/${proposalId}` : "";
  const isComplete = status?.status === "executed";
  const isApproved = status?.status === "approved";

  return (
    <Screen edges={["top", "bottom"]} centered>
      <OnboardingHeader />
      <StepDots step={step} total={3} labels={["Address", "New passkey", "Approvals"]} />

      <Card glass>
        <View style={styles.stack}>
          <View style={styles.titleRow}>
            <View
              style={[
                styles.disc,
                {
                  backgroundColor: alpha(colors.primary, 0.12),
                  borderColor: alpha(colors.primary, 0.3),
                },
              ]}
            >
              <Ionicons name="shield-half-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h1">Recover wallet</Text>
              <Text variant="small" tone="muted">
                Regain access with your guardians
              </Text>
            </View>
          </View>

          {step === 1 && (
            <>
              <View
                style={[
                  styles.info,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                    borderRadius: radius.lg,
                  },
                ]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.mutedForeground}
                />
                <Text variant="small" tone="muted" style={{ flex: 1 }}>
                  This creates a{" "}
                  <Text variant="small" weight="700">
                    new passkey
                  </Text>{" "}
                  on this device and proposes it as your wallet’s signer. Your guardians must
                  approve before it takes effect.
                </Text>
              </View>
              <Input
                label="Lost wallet address"
                placeholder="G… (56 characters)"
                value={walletAddress}
                onChangeText={(v) => setWalletAddress(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                mono
                error={
                  walletAddress.length > 0 && !addressValid
                    ? "Enter a valid 56-character Stellar address"
                    : undefined
                }
              />
              <Button
                size="lg"
                fullWidth
                disabled={!addressValid}
                onPress={start}
                iconRight={
                  <Ionicons name="arrow-forward" size={18} color={colors.primaryForeground} />
                }
              >
                Start recovery
              </Button>
            </>
          )}

          {step === 2 && (
            <PasskeyPrompt
              processing={processing}
              message="Creating a new passkey on this device…"
            />
          )}

          {step === 3 &&
            (isComplete ? (
              <View style={styles.done}>
                <View
                  style={[
                    styles.disc,
                    styles.discLg,
                    {
                      backgroundColor: colors.successSoft,
                      borderColor: alpha(colors.success, 0.35),
                    },
                  ]}
                >
                  <Ionicons name="checkmark" size={32} color={colors.success} />
                </View>
                <Text variant="h2" align="center">
                  Recovery complete
                </Text>
                <Text tone="muted" align="center">
                  Your new passkey is now the authorised signer. Sign in to continue.
                </Text>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.info,
                    {
                      backgroundColor: colors.muted,
                      borderColor: colors.border,
                      borderRadius: radius.lg,
                      flexDirection: "column",
                      gap: 10,
                    },
                  ]}
                >
                  <Text variant="bodyMedium">Share this link with your guardians</Text>
                  <Text variant="mono" tone="muted" selectable numberOfLines={2}>
                    {shareLink}
                  </Text>
                  <View style={styles.actions}>
                    <Button
                      size="sm"
                      icon={
                        <Ionicons name="share-outline" size={14} color={colors.primaryForeground} />
                      }
                      onPress={() =>
                        Share.share({
                          message: `Please approve my Guardian Wallet recovery: ${shareLink}`,
                        })
                      }
                    >
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Ionicons name="copy-outline" size={14} color={colors.foreground} />}
                      onPress={async () => {
                        await Clipboard.setStringAsync(shareLink);
                        toast.success("Link copied");
                      }}
                    >
                      Copy
                    </Button>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  <Text variant="bodyMedium">Proposal status</Text>
                  {statusLoading ? (
                    <Badge variant="secondary">Checking…</Badge>
                  ) : (
                    <Badge variant={isApproved ? "success" : "warning"} dot>
                      {(status?.status ?? "pending").toUpperCase()}
                    </Badge>
                  )}
                </View>
                <Separator />
                <View style={styles.statusRow}>
                  <Text variant="bodyMedium">Approvals</Text>
                  <Text variant="mono">{status?.approvals?.length ?? 0} collected</Text>
                </View>
                {status?.timelockExpiresAt ? (
                  <>
                    <Separator />
                    <View style={styles.statusRow}>
                      <Text variant="small" tone="muted">
                        Timelock expires
                      </Text>
                      <Text variant="small" tone="muted">
                        {new Date(status.timelockExpiresAt).toLocaleString()}
                      </Text>
                    </View>
                  </>
                ) : null}
                {isApproved ? (
                  <Button size="lg" fullWidth>
                    Execute recovery
                  </Button>
                ) : null}
              </>
            ))}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  disc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  discLg: { width: 72, height: 72, borderRadius: 36 },
  info: { flexDirection: "row", gap: 10, padding: 14, borderWidth: 1, alignItems: "flex-start" },
  actions: { flexDirection: "row", gap: 8 },
  statusRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  done: { alignItems: "center", gap: 10, paddingVertical: 12 },
});
