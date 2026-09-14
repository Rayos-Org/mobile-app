import { Linking, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Button, Card, CardHeader, EmptyState, ListRow, Skeleton, Text } from "@/components/ui";
import { useTheme } from "@/hooks/useTheme";
import { useTransactions } from "@/hooks/useWallet";
import { formatXLM, shortAddress } from "@/lib/format";
import { EXPLORER_URL } from "@/lib/config";

/** Native-token transfers touching the wallet, from Soroban RPC events (same source as web). */
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
            title="Couldn't load activity"
            description="Soroban RPC is unreachable. Pull to refresh."
          />
        </View>
      ) : !data || data.length === 0 ? (
        <View style={{ padding: 18 }}>
          <EmptyState
            icon={<Ionicons name="time-outline" size={24} color={colors.mutedForeground} />}
            title="No activity yet"
            description="Fund the wallet with testnet XLM and send your first transaction."
          />
        </View>
      ) : (
        data.map((t, i) => {
          const isOut = t.direction === "out";
          const tone = isOut ? "destructive" : "success";
          return (
            <ListRow
              key={`${t.txHash}-${t.ledger}-${i}`}
              icon={
                <Ionicons
                  name={isOut ? "arrow-up" : "arrow-down"}
                  size={18}
                  color={isOut ? colors.destructive : colors.success}
                />
              }
              iconTone={tone}
              title={
                isOut
                  ? `Sent to ${shortAddress(t.to, 6, 4)}`
                  : `Received from ${shortAddress(t.from, 6, 4)}`
              }
              subtitle={`${formatDistanceToNow(new Date(t.at), { addSuffix: true })} · ledger ${t.ledger}`}
              last={i === data.length - 1}
              onPress={() => Linking.openURL(`${EXPLORER_URL}/tx/${t.txHash}`)}
              right={
                <Text variant="bodyMedium" weight="600" tone={tone}>
                  {isOut ? "−" : "+"}
                  {formatXLM(t.amount)} XLM
                </Text>
              }
            />
          );
        })
      )}
    </Card>
  );
}
