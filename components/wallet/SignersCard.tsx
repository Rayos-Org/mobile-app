import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Badge, Card, CardHeader, EmptyState, ListRow, Skeleton } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useWallet } from "@/hooks/useWallet";
import { bytesToHex } from "@/lib/format";

/** Authorised signers from the GuardianWallet contract. */
export function SignersCard({ walletAddress }: { walletAddress: string }) {
  const { colors } = useTheme();
  const { data, isLoading } = useWallet(walletAddress);
  const signers = data?.signers ?? [];

  return (
    <Card flush>
      <CardHeader
        title="Authorized signers"
        icon={<Ionicons name="shield-checkmark" size={18} color={colors.primary} />}
        style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 6 }}
      />
      {isLoading ? (
        <View style={{ padding: 18, gap: 12 }}>
          <Skeleton height={44} />
          <Skeleton height={44} />
        </View>
      ) : signers.length === 0 ? (
        <View style={{ padding: 18 }}>
          <EmptyState
            icon={<Ionicons name="key-outline" size={22} color={colors.mutedForeground} />}
            title="No signer data"
            description="Signers appear once the contract is reachable on Soroban RPC."
          />
        </View>
      ) : (
        signers.map((s, i) => (
          <ListRow
            key={i}
            icon={<Ionicons name="key" size={16} color={colors.primary} />}
            title={`${bytesToHex(s.publicKeyBytes).slice(0, 18)}…`}
            mono
            subtitle="Passkey signer"
            last={i === signers.length - 1}
            right={<Badge variant="outline">{`Weight ${String(s.weight)}`}</Badge>}
          />
        ))
      )}
    </Card>
  );
}
