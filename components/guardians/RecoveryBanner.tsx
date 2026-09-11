import { StyleSheet, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Text, useToast } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useSignPolicyChange } from "@/hooks/usePolicies";
import type { RecoveryProposalStatus } from "@/hooks/useRecovery";
import { useAuthStore } from "@/store/auth";
import { api, errorMessage } from "@/lib/api";
import { PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

/**
 * Warns the owner when a recovery proposal is open against their wallet and
 * lets them cancel it with a passkey signature.
 */
export function RecoveryBanner() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const { walletAddress, credentialId, userHandle } = useAuthStore();
  const sign = useSignPolicyChange();

  const { data } = useQuery({
    queryKey: ["active-recovery", walletAddress],
    queryFn: async (): Promise<RecoveryProposalStatus | null> => {
      try {
        return await api<RecoveryProposalStatus>(
          `/recovery/status?walletAddress=${encodeURIComponent(walletAddress!)}`
        );
      } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!walletAddress,
    retry: false,
    refetchInterval: 30_000,
  });

  if (!data || data.status === "executed" || data.status === "cancelled") return null;

  const cancel = async () => {
    if (!credentialId) return;
    try {
      await sign.mutateAsync({ credentialId, userHandle: userHandle ?? walletAddress! });
      // SDK: walletSdk.cancelRecovery(walletAddress, data.proposalId)
      toast.success("Recovery cancelled");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError)) toast.error("Cancel failed", errorMessage(err));
    }
  };

  const n = data.approvals.length;

  return (
    <View
      style={[styles.banner, { backgroundColor: alpha(colors.destructive, 0.08), borderColor: alpha(colors.destructive, 0.4), borderRadius: radius["2xl"] }]}
    >
      <View style={styles.row}>
        <View style={[styles.disc, { backgroundColor: alpha(colors.destructive, 0.15) }]}>
          <Ionicons name="alert" size={20} color={colors.destructive} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h3" tone="destructive">
            Active recovery in progress
          </Text>
          <Text variant="small" tone="muted" style={{ marginTop: 2 }}>
            A recovery request for this wallet is pending.
          </Text>
        </View>
        <Badge variant="destructive">{`${n} approval${n === 1 ? "" : "s"}`}</Badge>
      </View>
      <Button variant="destructive" fullWidth loading={sign.isPending} onPress={cancel} style={{ marginTop: 12 }}>
        Cancel recovery
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { padding: 16, borderWidth: 1 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  disc: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});
