import { Linking, Pressable, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Button, Skeleton, Text, useToast } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useAccountExists, useWallet } from "@/hooks/useWallet";
import { formatXLM, shortAddress } from "@/lib/format";
import { EXPLORER_URL, FRIENDBOT_URL } from "@/lib/config";
import { alpha } from "@/lib/theme";

interface Props {
  walletAddress: string;
  onSend: () => void;
  onReceive: () => void;
}

/** Hero balance card — gradient surface, address chip, Send/Receive. */
export function BalanceCard({ walletAddress, onSend, onReceive }: Props) {
  const { colors, radius, isDark } = useTheme();
  const toast = useToast();
  const { data, isLoading, isError } = useWallet(walletAddress);
  const { data: exists, isLoading: checking } = useAccountExists(walletAddress);

  const copy = async () => {
    await Clipboard.setStringAsync(walletAddress);
    toast.success("Address copied");
  };

  return (
    <View style={[styles.card, { borderRadius: radius["3xl"], borderColor: alpha("#FFFFFF", isDark ? 0.1 : 0.4) }]}>
      <LinearGradient
        colors={isDark ? ["#3730A3", "#5B21B6", "#0E7490"] : ["#4F46E5", "#6D4AED", "#0891B2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* highlight bloom */}
      <View style={[styles.bloom, { backgroundColor: alpha("#FFFFFF", 0.08) }]} />

      <View style={styles.header}>
        <Text variant="caption" style={{ color: alpha("#FFFFFF", 0.75) }}>
          Balance · Testnet
        </Text>
        {!checking && exists === false ? (
          <Badge variant="warning" dot>
            Unfunded
          </Badge>
        ) : !checking && exists ? (
          <Badge variant="success" dot>
            Active
          </Badge>
        ) : null}
      </View>

      {isLoading ? (
        <View style={{ marginTop: 14, gap: 8 }}>
          <Skeleton width={180} height={44} radius={12} style={{ backgroundColor: alpha("#FFFFFF", 0.15) }} />
        </View>
      ) : isError ? (
        <View style={{ marginTop: 14 }}>
          <Text variant="h1" style={{ color: "#fff" }}>
            —
          </Text>
          <Text variant="small" style={{ color: alpha("#FFFFFF", 0.75) }}>
            Couldn’t load balance from Soroban RPC
          </Text>
        </View>
      ) : (
        <View style={styles.balanceRow}>
          <Text variant="display" style={{ color: "#fff", fontSize: 44 }} testID="balance-value">
            {formatXLM(data?.balance ?? 0n)}
          </Text>
          <Text variant="h3" style={{ color: alpha("#FFFFFF", 0.75), marginBottom: 6 }}>
            XLM
          </Text>
        </View>
      )}

      <Pressable
        onPress={copy}
        accessibilityLabel="Copy wallet address"
        style={({ pressed }) => [
          styles.addressChip,
          { backgroundColor: alpha("#000", pressed ? 0.35 : 0.22), borderColor: alpha("#FFFFFF", 0.14), borderRadius: radius.lg },
        ]}
      >
        <Text variant="mono" style={{ color: alpha("#FFFFFF", 0.9), flex: 1 }} numberOfLines={1}>
          {shortAddress(walletAddress, 8, 6)}
        </Text>
        <Ionicons name="copy-outline" size={16} color={alpha("#FFFFFF", 0.8)} />
        <Pressable
          hitSlop={8}
          accessibilityLabel="View on explorer"
          onPress={() => Linking.openURL(`${EXPLORER_URL}/account/${walletAddress}`)}
        >
          <Ionicons name="open-outline" size={16} color={alpha("#FFFFFF", 0.8)} />
        </Pressable>
      </Pressable>

      {!checking && exists === false ? (
        <Pressable
          onPress={() => Linking.openURL(`${FRIENDBOT_URL}?addr=${walletAddress}`)}
          style={[styles.fundNote, { backgroundColor: alpha("#FBBF24", 0.16), borderColor: alpha("#FBBF24", 0.4), borderRadius: radius.lg }]}
        >
          <Ionicons name="water-outline" size={16} color="#FDE68A" />
          <Text variant="small" style={{ color: "#FEF3C7", flex: 1 }}>
            Fund with testnet XLM via Friendbot to activate this wallet →
          </Text>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Button
          fullWidth
          testID="send-button"
          style={[styles.action, { backgroundColor: "#fff" }]}
          haptic
          onPress={onSend}
          icon={<Ionicons name="arrow-up" size={18} color={colors.primary} />}
        >
          <Text variant="bodyMedium" weight="600" style={{ color: "#4F46E5" }}>
            Send
          </Text>
        </Button>
        <Button
          fullWidth
          variant="outline"
          style={[styles.action, { backgroundColor: alpha("#FFFFFF", 0.12), borderColor: alpha("#FFFFFF", 0.3) }]}
          onPress={onReceive}
          icon={<Ionicons name="arrow-down" size={18} color="#fff" />}
        >
          <Text variant="bodyMedium" weight="600" style={{ color: "#fff" }}>
            Receive
          </Text>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 22, overflow: "hidden", borderWidth: 1 },
  bloom: { position: "absolute", width: 260, height: 260, borderRadius: 130, top: -120, right: -80 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, marginTop: 10 },
  addressChip: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, marginTop: 16, borderWidth: 1 },
  fundNote: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginTop: 12, borderWidth: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  action: { flex: 1 },
});
