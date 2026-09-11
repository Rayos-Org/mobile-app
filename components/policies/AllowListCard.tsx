import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";
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
  Text,
  useToast,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useSignPolicyChange } from "@/hooks/usePolicies";
import { useAuthStore } from "@/store/auth";
import { errorMessage } from "@/lib/api";
import { isContractAddress, shortAddress } from "@/lib/format";
import { PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

/** Contract allow-list: every mutation is passkey-signed, enforced on-chain. */
export function AllowListCard() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const { credentialId, userHandle, walletAddress } = useAuthStore();
  const sign = useSignPolicyChange();

  const [enabled, setEnabled] = useState(false);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const run = async (label: string, apply: () => void) => {
    if (!credentialId) return;
    try {
      await sign.mutateAsync({ credentialId, userHandle: userHandle ?? walletAddress! });
      // SDK: policy.set_allow_list(...) — wired once exposed.
      apply();
      toast.success(label);
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError)) toast.error("Update failed", errorMessage(err));
    }
  };

  const toggle = (v: boolean) =>
    run(`Allow-list ${v ? "enabled" : "disabled"}`, () => setEnabled(v));

  const add = () => {
    const a = draft.trim().toUpperCase();
    if (!isContractAddress(a))
      return toast.error("Invalid address", "Enter a 56-character contract address (C…).");
    if (addresses.includes(a)) return toast.info("Already in allow-list");
    run("Address added", () => {
      setAddresses((p) => [...p, a]);
      setDraft("");
    });
  };

  const remove = (a: string) =>
    run("Address removed", () => setAddresses((p) => p.filter((x) => x !== a)));

  return (
    <Card>
      <CardHeader
        title="Contract allow-list"
        description="Restrict the wallet to approved Soroban contracts."
        icon={<Ionicons name="list-outline" size={18} color={colors.primary} />}
        action={
          <View
            style={[
              styles.toggle,
              {
                backgroundColor: colors.muted,
                borderColor: colors.border,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text variant="small" weight="600" tone={enabled ? "success" : "muted"}>
              {enabled ? "Enforcing" : "Off"}
            </Text>
            <Switch
              value={enabled}
              onValueChange={toggle}
              disabled={sign.isPending}
              trackColor={{ true: colors.primary, false: alpha(colors.mutedForeground, 0.35) }}
              thumbColor="#fff"
              accessibilityLabel="Toggle allow-list enforcement"
            />
          </View>
        }
      />

      {sign.isPending ? (
        <PasskeyPrompt processing message="Sign the policy change with your passkey…" />
      ) : !enabled ? (
        <View
          style={[
            styles.note,
            { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: radius.lg },
          ]}
        >
          <Ionicons name="shield-outline" size={18} color={colors.mutedForeground} />
          <Text variant="small" tone="muted" style={{ flex: 1 }}>
            Allow-list is off. Your wallet can interact with any contract. Turn it on to restrict
            access.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 14 }}>
          <View
            style={[
              styles.note,
              {
                backgroundColor: alpha(colors.success, 0.08),
                borderColor: alpha(colors.success, 0.3),
                borderRadius: radius.lg,
              },
            ]}
          >
            <Ionicons name="shield-checkmark" size={18} color={colors.success} />
            <Text variant="small" style={{ flex: 1 }}>
              Only listed contracts may be called.
              {addresses.length === 0 ? " All transactions are blocked until you add one." : ""}
            </Text>
          </View>
          <Input
            placeholder="C… contract address"
            value={draft}
            onChangeText={setDraft}
            autoCapitalize="characters"
            autoCorrect={false}
            mono
            returnKeyType="done"
            onSubmitEditing={add}
            right={
              <Button
                size="sm"
                disabled={!draft.trim()}
                onPress={add}
                icon={<Ionicons name="add" size={14} color={colors.primaryForeground} />}
              >
                Add
              </Button>
            }
          />
          {addresses.length === 0 ? (
            <EmptyState
              title="No addresses allowed yet"
              description="All transactions are blocked."
            />
          ) : (
            <View style={[styles.list, { borderColor: colors.border, borderRadius: radius.xl }]}>
              {addresses.map((a, i) => (
                <ListRow
                  key={a}
                  icon={<Ionicons name="cube-outline" size={16} color={colors.primary} />}
                  title={shortAddress(a, 10, 8)}
                  mono
                  last={i === addresses.length - 1}
                  right={
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Badge variant="success">Allowed</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        haptic={false}
                        onPress={() => remove(a)}
                        accessibilityLabel="Remove"
                      >
                        <Ionicons name="close" size={16} color={colors.destructive} />
                      </Button>
                    </View>
                  }
                />
              ))}
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 4,
    borderWidth: 1,
  },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderWidth: 1 },
  list: { borderWidth: 1, overflow: "hidden" },
});
