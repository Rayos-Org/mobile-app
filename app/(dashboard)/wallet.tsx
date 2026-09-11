import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge, Screen } from "@/components/ui";
import { BalanceCard } from "@/components/wallet/BalanceCard";
import { ActivityList } from "@/components/wallet/ActivityList";
import { SignersCard } from "@/components/wallet/SignersCard";
import { SendSheet } from "@/components/wallet/SendSheet";
import { ReceiveSheet } from "@/components/wallet/ReceiveSheet";
import { useAuthStore } from "@/store/auth";
import { walletKeys } from "@/hooks/useWallet";

export default function WalletScreen() {
  const walletAddress = useAuthStore((s) => s.walletAddress)!;
  const walletName = useAuthStore((s) => s.walletName);
  const qc = useQueryClient();
  const [sendOpen, setSendOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    await Promise.all([
      qc.invalidateQueries({ queryKey: walletKeys.state(walletAddress) }),
      qc.invalidateQueries({ queryKey: walletKeys.txs(walletAddress) }),
      qc.invalidateQueries({ queryKey: walletKeys.exists(walletAddress) }),
    ]);
    setRefreshing(false);
  };

  return (
    <Screen
      title={walletName ? `Hi, ${walletName}` : "Wallet"}
      subtitle="Your balance and on-chain activity"
      headerRight={
        <Badge variant="primary" dot>
          Testnet
        </Badge>
      }
      refreshing={refreshing}
      onRefresh={refresh}
    >
      <BalanceCard
        walletAddress={walletAddress}
        onSend={() => setSendOpen(true)}
        onReceive={() => setReceiveOpen(true)}
      />
      <ActivityList walletAddress={walletAddress} />
      <SignersCard walletAddress={walletAddress} />

      <SendSheet open={sendOpen} onClose={() => setSendOpen(false)} />
      <ReceiveSheet open={receiveOpen} onClose={() => setReceiveOpen(false)} walletAddress={walletAddress} />
    </Screen>
  );
}
