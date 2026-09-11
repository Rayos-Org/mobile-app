import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Badge,
  Button,
  Card,
  Input,
  PasskeyPrompt,
  Screen,
  Separator,
  Skeleton,
  Text,
  useToast,
} from "@/components/ui";
import { OnboardingHeader } from "@/components/layout/OnboardingHeader";
import { useTheme } from "@/hooks/useTheme";
import { useApproveRecovery, useRecoveryProposal } from "@/hooks/useRecovery";
import { useAuthStore } from "@/store/auth";
import { errorMessage } from "@/lib/api";
import { isStellarAddress, shortAddress } from "@/lib/format";
import { PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

/**
 * Guardian approval — the deep-link target for
 *   rayos://recovery/<id>  and  https://<PASSKEY_DOMAIN>/recovery/<id>
 * Works signed-in (address pre-filled) or signed-out (guardian types it).
 */
export default function ApproveRecoveryScreen() {
  const { proposalId } = useLocalSearchParams<{ proposalId: string }>();
  const router = useRouter();
  const { colors, radius } = useTheme();
  const toast = useToast();
  const auth = useAuthStore();
  const { data: proposal, isLoading } = useRecoveryProposal(proposalId);
  const approve = useApproveRecovery();

  const [guardianAddress, setGuardianAddress] = useState(auth.walletAddress ?? "");
  const [done, setDone] = useState(false);

  const valid = isStellarAddress(guardianAddress);
  const pending = proposal?.status === "pending";

  const submit = async () => {
    if (!proposalId) return;
    try {
      await approve.mutateAsync({
        walletAddress: guardianAddress.trim(),
        proposalId,
        credentialId: auth.credentialId ?? undefined,
        userHandle: auth.userHandle ?? guardianAddress.trim(),
      });
      setDone(true);
      toast.success("Approval submitted");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError))
        toast.error("Approval failed", errorMessage(err));
    }
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <Screen edges={["top", "bottom"]} centered>
      <OnboardingHeader backTo="/" />
      <Card glass>
        {done ? (
          <View style={styles.done}>
            <View
              style={[
                styles.disc,
                { backgroundColor: colors.successSoft, borderColor: alpha(colors.success, 0.35) },
              ]}
            >
              <Ionicons name="shield-checkmark" size={36} color={colors.success} />
            </View>
            <Text variant="h1" align="center">
              Approval submitted
            </Text>
            <Text tone="muted" align="center">
              Your approval has been recorded. The wallet owner regains access once the threshold is
              met.
            </Text>
            <Button size="lg" fullWidth variant="outline" onPress={close} style={{ marginTop: 8 }}>
              Close
            </Button>
          </View>
        ) : (
          <View style={styles.stack}>
            <Text variant="h1">Guardian approval</Text>
            <Text tone="muted">
              You have been asked to approve a wallet recovery as a trusted guardian.
            </Text>

            <View
              style={[
                styles.summary,
                {
                  backgroundColor: colors.muted,
                  borderColor: colors.border,
                  borderRadius: radius.xl,
                },
              ]}
            >
              <Row label="Proposal">
                <Text variant="mono">{shortAddress(proposalId, 8, 6)}</Text>
              </Row>
              <Separator />
              <Row label="Status">
                {isLoading ? (
                  <Skeleton width={70} height={22} radius={11} />
                ) : (
                  <Badge variant={pending ? "warning" : proposal ? "secondary" : "destructive"} dot>
                    {(proposal?.status ?? "not found").toUpperCase()}
                  </Badge>
                )}
              </Row>
              {proposal?.approvals?.length ? (
                <>
                  <Separator />
                  <Row label="Approvals">
                    <Text variant="bodyMedium">{`${proposal.approvals.length} collected`}</Text>
                  </Row>
                </>
              ) : null}
              {proposal?.timelockExpiresAt ? (
                <>
                  <Separator />
                  <Row label="Timelock expires">
                    <Text variant="small" tone="muted">
                      {new Date(proposal.timelockExpiresAt).toLocaleString()}
                    </Text>
                  </Row>
                </>
              ) : null}
            </View>

            {!isLoading && !pending ? (
              <View
                style={[
                  styles.note,
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
                  {proposal
                    ? `This proposal is ${proposal.status} and no longer needs approval.`
                    : "This proposal could not be found. The link may have expired."}
                </Text>
              </View>
            ) : null}

            {approve.isPending ? (
              <PasskeyPrompt processing message="Sign your approval with your passkey…" />
            ) : (
              <Input
                label="Your wallet address (guardian)"
                placeholder="G…"
                value={guardianAddress}
                onChangeText={(v) => setGuardianAddress(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                mono
                editable={!auth.walletAddress}
                hint="Used to look up your passkey for signing."
              />
            )}

            {!approve.isPending ? (
              <Button
                size="lg"
                fullWidth
                disabled={!valid || !pending}
                onPress={submit}
                icon={<Ionicons name="finger-print" size={18} color={colors.primaryForeground} />}
              >
                Sign & approve recovery
              </Button>
            ) : null}
          </View>
        )}
      </Card>
    </Screen>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text variant="small" tone="muted">
        {label}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 16 },
  summary: { borderWidth: 1, paddingHorizontal: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    gap: 12,
  },
  note: { flexDirection: "row", gap: 10, padding: 12, borderWidth: 1, alignItems: "flex-start" },
  done: { alignItems: "center", gap: 12, paddingVertical: 12 },
  disc: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
