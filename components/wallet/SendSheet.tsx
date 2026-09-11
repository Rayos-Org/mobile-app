import { useEffect, useState } from "react";
import { Linking, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Input, PasskeyPrompt, Sheet, Text, useToast } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useSendTransaction, useTransactionStatus } from "@/hooks/useWallet";
import { useAuthStore } from "@/store/auth";
import { errorMessage } from "@/lib/api";
import { isStellarAddress } from "@/lib/format";
import { EXPLORER_URL } from "@/lib/config";
import { PasskeyCancelledError } from "@/native/passkey-adapter";
import { alpha } from "@/lib/theme";

type Step = "form" | "passkey" | "submitted";

/** Send XLM — form → passkey signature → relay submission with live status. */
export function SendSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const toast = useToast();
  const { walletAddress, credentialId, userHandle } = useAuthStore();
  const send = useSendTransaction();

  const [step, setStep] = useState<Step>("form");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState<string | undefined>();
  const { data: status } = useTransactionStatus(txHash);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("form");
        setTo("");
        setAmount("");
        setTxHash(undefined);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const toValid = isStellarAddress(to);
  const amountNum = Number(amount);
  const amountValid = amount.trim() !== "" && !Number.isNaN(amountNum) && amountNum > 0;

  const submit = async () => {
    if (!walletAddress || !credentialId) return;
    setStep("passkey");
    try {
      const res = await send.mutateAsync({
        walletAddress,
        credentialId,
        userHandle: userHandle ?? walletAddress,
        to: to.trim(),
        amount: amount.trim(),
      });
      setTxHash(res.hash);
      setStep("submitted");
      toast.success("Transaction submitted", "The relay is broadcasting it now.");
    } catch (err) {
      setStep("form");
      if (!(err instanceof PasskeyCancelledError)) toast.error("Send failed", errorMessage(err));
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      dismissable={step !== "passkey"}
      title="Send XLM"
      description="Send to any Stellar address on testnet."
      footer={
        step === "form" ? (
          <Button
            size="lg"
            fullWidth
            disabled={!toValid || !amountValid}
            onPress={submit}
            testID="send-continue"
          >
            Review & sign
          </Button>
        ) : step === "submitted" ? (
          <Button size="lg" fullWidth variant="outline" onPress={onClose}>
            Done
          </Button>
        ) : null
      }
    >
      {step === "form" && (
        <View style={styles.stack}>
          <Input
            label="Recipient address"
            placeholder="G…"
            value={to}
            onChangeText={(v) => setTo(v.toUpperCase())}
            autoCapitalize="characters"
            autoCorrect={false}
            mono
            error={
              to.length > 0 && !toValid ? "Enter a valid 56-character Stellar address" : undefined
            }
          />
          <Input
            label="Amount"
            placeholder="0.00"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            right={
              <Text variant="bodyMedium" tone="muted">
                XLM
              </Text>
            }
            error={amount.length > 0 && !amountValid ? "Enter an amount greater than 0" : undefined}
          />
          <View
            style={[
              styles.note,
              {
                backgroundColor: alpha(colors.primary, 0.08),
                borderColor: alpha(colors.primary, 0.25),
              },
            ]}
          >
            <Ionicons name="finger-print" size={16} color={colors.primary} />
            <Text variant="small" tone="muted" style={{ flex: 1 }}>
              You’ll confirm with your passkey. Fees are sponsored by the relay.
            </Text>
          </View>
        </View>
      )}

      {step === "passkey" && (
        <PasskeyPrompt processing message="Sign this transaction with your passkey…" />
      )}

      {step === "submitted" && (
        <View style={styles.done}>
          <View
            style={[
              styles.disc,
              { backgroundColor: colors.successSoft, borderColor: alpha(colors.success, 0.35) },
            ]}
          >
            <Ionicons name="checkmark" size={30} color={colors.success} />
          </View>
          <Text variant="h2" align="center">
            Submitted
          </Text>
          <Text tone="muted" align="center">
            {amount} XLM is on its way.
          </Text>
          {txHash ? (
            <>
              <View style={styles.statusRow}>
                <Text variant="small" tone="muted">
                  Status
                </Text>
                <Badge
                  variant={
                    status?.status === "success"
                      ? "success"
                      : status?.status === "failed"
                        ? "destructive"
                        : "warning"
                  }
                  dot
                >
                  {(status?.status ?? "pending").toUpperCase()}
                </Badge>
              </View>
              <Button
                variant="ghost"
                onPress={() => Linking.openURL(`${EXPLORER_URL}/tx/${txHash}`)}
                iconRight={
                  <Ionicons name="open-outline" size={14} color={colors.mutedForeground} />
                }
              >
                View on Stellar Expert
              </Button>
            </>
          ) : null}
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  done: { alignItems: "center", gap: 10, paddingVertical: 10 },
  disc: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 6 },
});
