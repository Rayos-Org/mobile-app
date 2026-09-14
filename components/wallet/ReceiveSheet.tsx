import { Share, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Button, Sheet, Text, useToast } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useFaucet } from "@/hooks/useWallet";

/** Receive — full address, copy/share, and the relay testnet faucet. */
export function ReceiveSheet({
  open,
  onClose,
  walletAddress,
}: {
  open: boolean;
  onClose: () => void;
  walletAddress: string;
}) {
  const { colors, radius } = useTheme();
  const toast = useToast();
  const faucet = useFaucet();

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Receive XLM"
      description="Share your address to receive XLM or any Stellar asset."
      footer={
        <Button size="lg" fullWidth variant="outline" onPress={onClose}>
          Close
        </Button>
      }
    >
      <View
        style={[
          styles.box,
          { backgroundColor: colors.muted, borderColor: colors.border, borderRadius: radius.xl },
        ]}
      >
        <Text variant="caption" tone="muted">
          Wallet address
        </Text>
        <Text variant="mono" selectable style={{ marginTop: 8, lineHeight: 20 }}>
          {walletAddress}
        </Text>
      </View>
      <View style={styles.row}>
        <Button
          style={{ flex: 1 }}
          icon={<Ionicons name="copy-outline" size={16} color={colors.primaryForeground} />}
          onPress={async () => {
            await Clipboard.setStringAsync(walletAddress);
            toast.success("Address copied");
          }}
        >
          Copy
        </Button>
        <Button
          style={{ flex: 1 }}
          variant="outline"
          icon={<Ionicons name="share-outline" size={16} color={colors.foreground} />}
          onPress={() => Share.share({ message: walletAddress })}
        >
          Share
        </Button>
      </View>
      <Button
        variant="ghost"
        fullWidth
        icon={<Ionicons name="water-outline" size={16} color={colors.mutedForeground} />}
        loading={faucet.isPending}
        onPress={async () => {
          try {
            const res = await faucet.mutateAsync(walletAddress);
            toast.success("Testnet XLM received", `${Number(res.amount) / 1e7} XLM`);
          } catch (err) {
            toast.error(
              "Faucet failed",
              err instanceof Error ? err.message : "Try again in a minute"
            );
          }
        }}
      >
        Get 100 testnet XLM from the faucet
      </Button>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  box: { padding: 16, borderWidth: 1 },
  row: { flexDirection: "row", gap: 10 },
});
