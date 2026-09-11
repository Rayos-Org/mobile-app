import { Linking, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Button, Card, CardHeader, EmptyState, ListRow, Skeleton, Text } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useTransactions, type HorizonOperation } from "@/hooks/useWallet";
import { formatAmount, shortAddress } from "@/lib/format";
import { EXPLORER_URL } from "@/lib/config";

type Tone = "primary" | "success" | "destructive" | "muted";

function describe(
  op: HorizonOperation,
  me: string
): { title: string; icon: keyof typeof Ionicons.glyphMap; tone: Tone; sign: string } {
  const isSend = op.from === me || op.source_account === me;
  switch (op.type) {
    case "payment":
      return {
        title: isSend
          ? `Sent to ${shortAddress(op.to, 6, 4)}`
          : `Received from ${shortAddress(op.from, 6, 4)}`,
        icon: isSend ? "arrow-up" : "arrow-down",
        tone: isSend ? "destructive" : "success",
        sign: isSend ? "−" : "+",
      };
    case "create_account":
      return { title: "Account created", icon: "sparkles", tone: "success", sign: "+" };
    case "change_trust":
      return { title: "Trust line changed", icon: "link", tone: "primary", sign: "" };
    case "set_options":
      return { title: "Options updated", icon: "options", tone: "primary", sign: "" };
    default:
      return {
        title: op.type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: "swap-horizontal",
        tone: "muted",
        sign: "",
      };
  }
}

/** Recent on-chain operations from Horizon — same source as the web dashboard. */
export function ActivityList({ walletAddress }: { walletAddress: string }) {
  const { colors } = useTheme();
  const { data, isLoading, isError, refetch, isRefetching } = useTransactions(walletAddress);

  return (
    <Card flush>
      <CardHeader
        title="Recent activity"
        style={{ paddingHorizontal: 18, paddingTop: 18, marginBottom: 6 }}
        action={
          <Button size="sm" variant="outline" loading={isRefetching} onPress={() => refetch()}>
            Refresh
          </Button>
        }
      />
      {isLoading ? (
        <View style={{ padding: 18, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
              <Skeleton width={40} height={40} radius={20} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width="60%" height={14} />
                <Skeleton width="35%" height={10} />
              </View>
              <Skeleton width={64} height={14} />
            </View>
          ))}
        </View>
      ) : isError ? (
        <View style={{ padding: 18 }}>
          <EmptyState
            icon={<Ionicons name="cloud-offline-outline" size={24} color={colors.destructive} />}
            title="Couldn’t load activity"
            description="Check your connection and pull to refresh."
          />
        </View>
      ) : !data || data.length === 0 ? (
        <View style={{ padding: 18 }}>
          <EmptyState
            icon={<Ionicons name="time-outline" size={24} color={colors.mutedForeground} />}
            title="No activity yet"
            description="Transactions will appear here once your wallet is funded."
          />
        </View>
      ) : (
        data.map((op, i) => {
          const d = describe(op, walletAddress);
          const amount = op.amount ?? op.starting_balance;
          const code = op.asset_code ?? (op.asset_type === "native" ? "XLM" : "");
          const iconColor = d.tone === "muted" ? colors.mutedForeground : colors[d.tone];
          return (
            <ListRow
              key={op.id}
              icon={<Ionicons name={d.icon} size={18} color={iconColor} />}
              iconTone={d.tone}
              title={d.title}
              subtitle={formatDistanceToNow(new Date(op.created_at), { addSuffix: true })}
              last={i === data.length - 1}
              onPress={() => Linking.openURL(`${EXPLORER_URL}/tx/${op.transaction_hash}`)}
              right={
                amount ? (
                  <Text variant="bodyMedium" weight="600" tone={d.tone === "muted" ? "default" : d.tone}>
                    {d.sign}
                    {formatAmount(amount)} {code}
                  </Text>
                ) : (
                  <Ionicons name="open-outline" size={16} color={colors.mutedForeground} />
                )
              }
            />
          );
        })
      )}
    </Card>
  );
}
