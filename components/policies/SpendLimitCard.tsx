import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Input,
  PasskeyPrompt,
  Text,
  useToast,
} from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useSignPolicyChange } from "@/hooks/usePolicies";
import { useAuthStore } from "@/store/auth";
import { errorMessage } from "@/lib/api";
import { PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

const WINDOWS = [
  { label: "1 hour", value: "3600" },
  { label: "24 hours", value: "86400" },
  { label: "7 days", value: "604800" },
] as const;

/** Rolling spend cap enforced by the on-chain policy module. */
export function SpendLimitCard() {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const { credentialId, userHandle, walletAddress } = useAuthStore();
  const sign = useSignPolicyChange();

  const [amount, setAmount] = useState("");
  const [window, setWindow] = useState<(typeof WINDOWS)[number]["value"]>("86400");
  const [current, setCurrent] = useState<{ amount: string; window: string } | null>(null);

  const valid = amount.trim() !== "" && Number(amount) > 0;

  const submit = async () => {
    if (!credentialId) return;
    try {
      await sign.mutateAsync({ credentialId, userHandle: userHandle ?? walletAddress! });
      // SDK: policy.set_spend_limit(token, amount, window) — wired once exposed.
      setCurrent({ amount, window });
      setAmount("");
      toast.success(
        "Spend limit set",
        `${amount} XLM per ${WINDOWS.find((w) => w.value === window)?.label}`
      );
    } catch (err) {
      if (!(err instanceof PasskeyCancelledError)) toast.error("Update failed", errorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader
        title="Spend limit"
        description="A rolling cap enforced by the smart contract policy module."
        icon={<Ionicons name="speedometer-outline" size={18} color={colors.primary} />}
      />

      {current ? (
        <View
          style={[
            styles.current,
            {
              backgroundColor: alpha(colors.success, 0.08),
              borderColor: alpha(colors.success, 0.3),
              borderRadius: radius.lg,
            },
          ]}
        >
          <Ionicons name="shield-checkmark" size={18} color={colors.success} />
          <Text variant="small" style={{ flex: 1 }}>
            Current limit:{" "}
            <Text variant="small" weight="700">
              {current.amount} XLM
            </Text>{" "}
            / {WINDOWS.find((w) => w.value === current.window)?.label}
          </Text>
          <Badge variant="success">Enforcing</Badge>
        </View>
      ) : null}

      {sign.isPending ? (
        <PasskeyPrompt processing message="Sign the policy update with your passkey…" />
      ) : (
        <View style={styles.stack}>
          <Input
            label="Asset"
            value="XLM (Native)"
            editable={false}
            left={<Ionicons name="logo-bitcoin" size={16} color={colors.mutedForeground} />}
          />
          <Input
            label="Limit amount"
            placeholder="100.00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            right={
              <Text variant="bodyMedium" tone="muted">
                XLM
              </Text>
            }
          />
          <View>
            <Text variant="small" weight="600" style={{ marginBottom: 8 }}>
              Time window
            </Text>
            <View style={styles.chips}>
              {WINDOWS.map((w) => {
                const active = w.value === window;
                return (
                  <Pressable
                    key={w.value}
                    onPress={() => setWindow(w.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    style={[
                      styles.chip,
                      {
                        borderRadius: radius.lg,
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? alpha(colors.primary, 0.12) : "transparent",
                      },
                    ]}
                  >
                    <Text variant="small" weight="600" tone={active ? "primary" : "muted"}>
                      {w.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
          <Button
            size="lg"
            fullWidth
            disabled={!valid}
            onPress={submit}
            icon={<Ionicons name="finger-print" size={18} color={colors.primaryForeground} />}
          >
            Set spend limit
          </Button>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  chips: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, height: 42, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  current: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
});
