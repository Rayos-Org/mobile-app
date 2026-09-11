import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  ListRow,
  PasskeyPrompt,
  Sheet,
  Skeleton,
  Text,
  useToast,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useWallet } from "@/hooks/useWallet";
import { useSignPolicyChange } from "@/hooks/usePolicies";
import { useAuthStore } from "@/store/auth";
import { errorMessage } from "@/lib/api";
import { bytesToHex, isStellarAddress } from "@/lib/format";
import { PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

/** Guardian signers from the contract + add/remove proposals (passkey-signed). */
export function GuardianList() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const { walletAddress, credentialId, userHandle } = useAuthStore();
  const { data, isLoading } = useWallet(walletAddress);
  const sign = useSignPolicyChange();

  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [weight, setWeight] = useState("1");

  const signers = data?.signers ?? [];
  const threshold = signers.length === 0 ? 0 : Math.max(1, Math.ceil(signers.length / 2));
  const valid = isStellarAddress(address) && Number(weight) >= 1 && Number(weight) <= 10;

  const propose = async () => {
    if (!credentialId) return;
    try {
      await sign.mutateAsync({ credentialId, userHandle: userHandle ?? walletAddress! });
      // SDK: walletSdk.proposeRecovery / add_signer — wired once exposed for guardians.
      toast.success("Guardian proposed", "Existing guardians must approve the change.");
      setOpen(false);
      setAddress("");
      setWeight("1");
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError)) toast.error("Proposal failed", errorMessage(err));
    }
  };

  const confirmRemove = (label: string) => {
    Alert.alert("Remove guardian?", `${label} will no longer be able to approve recovery.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          if (!credentialId) return;
          try {
            await sign.mutateAsync({ credentialId, userHandle: userHandle ?? walletAddress! });
            toast.success("Removal proposed");
          } catch (err) {
            if (!(err instanceof PasskeyCancelledError)) toast.error("Removal failed", errorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <>
      <Card flush>
        <CardHeader
          title="Recovery guardians"
          description="Trusted signers who can authorise wallet recovery."
          icon={<Ionicons name="people" size={18} color={colors.primary} />}
          style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 12 }}
          action={
            <Button size="sm" onPress={() => setOpen(true)} icon={<Ionicons name="add" size={16} color={colors.primaryForeground} />}>
              Add
            </Button>
          }
        />

        <View style={{ paddingHorizontal: 18, marginBottom: 12 }}>
          <View
            style={[styles.threshold, { backgroundColor: alpha(colors.primary, 0.07), borderColor: alpha(colors.primary, 0.3), borderRadius: radius.xl }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium">Recovery threshold</Text>
              <Text variant="small" tone="muted">
                Minimum approvals to execute recovery
              </Text>
            </View>
            <Badge variant="primary">
              <Text variant="mono" weight="700" tone="primary">
                {`${threshold} of ${signers.length}`}
              </Text>
            </Badge>
          </View>
        </View>

        {isLoading ? (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 12 }}>
            <Skeleton height={52} />
            <Skeleton height={52} />
          </View>
        ) : signers.length === 0 ? (
          <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
            <EmptyState
              icon={<Ionicons name="warning-outline" size={22} color={colors.warning} />}
              title="No guardians configured"
              description="Add at least one trusted guardian to enable wallet recovery."
              action={
                <Button size="sm" variant="outline" onPress={() => setOpen(true)}>
                  Add guardian
                </Button>
              }
            />
          </View>
        ) : (
          signers.map((s, i) => {
            const hex = bytesToHex(s.publicKeyBytes);
            const label = `${hex.slice(0, 12)}…${hex.slice(-8)}`;
            return (
              <ListRow
                key={i}
                icon={<Ionicons name="person" size={16} color={colors.primary} />}
                title={label}
                mono
                subtitle={`Weight ${String(s.weight)}`}
                last={i === signers.length - 1}
                right={
                  <Button
                    size="sm"
                    variant="ghost"
                    haptic={false}
                    disabled={signers.length <= 1 || sign.isPending}
                    onPress={() => confirmRemove(label)}
                    accessibilityLabel="Remove guardian"
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </Button>
                }
              />
            );
          })
        )}
      </Card>

      <Sheet
        open={open}
        onClose={() => !sign.isPending && setOpen(false)}
        dismissable={!sign.isPending}
        title="Add guardian"
        description="Propose a new guardian signer on-chain. Existing guardians must approve."
        footer={
          !sign.isPending ? (
            <Button size="lg" fullWidth disabled={!valid} onPress={propose} icon={<Ionicons name="finger-print" size={18} color={colors.primaryForeground} />}>
              Propose guardian
            </Button>
          ) : null
        }
      >
        {sign.isPending ? (
          <PasskeyPrompt processing message="Sign the guardian proposal with your passkey…" />
        ) : (
          <View style={{ gap: 14 }}>
            <Input
              label="Guardian Stellar address"
              placeholder="G…"
              value={address}
              onChangeText={(v) => setAddress(v.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              mono
              error={address.length > 0 && !isStellarAddress(address) ? "Enter a valid 56-character address" : undefined}
            />
            <Input
              label="Signer weight"
              keyboardType="number-pad"
              value={weight}
              onChangeText={setWeight}
              hint="Higher weight means more voting power for recovery proposals (1–10)."
            />
          </View>
        )}
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  threshold: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderWidth: 1, borderStyle: "dashed" },
});
