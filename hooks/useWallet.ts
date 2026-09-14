import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Transfer, WalletState } from "@rayos/wallet-sdk";
import { walletSdk } from "@/lib/sdk-client";
import { toStroops } from "@/lib/format";

export type { Transfer, WalletState };

export const walletKeys = {
  state: (addr: string | null | undefined) => ["wallet", addr] as const,
  txs: (addr: string | null | undefined) => ["transactions", addr] as const,
  txStatus: (hash: string | undefined) => ["tx-status", hash] as const,
};

/** Signers + native balance + existence, read from the wallet contract over Soroban RPC. */
export function useWallet(walletAddress?: string | null) {
  return useQuery({
    queryKey: walletKeys.state(walletAddress),
    queryFn: () => walletSdk.getWalletState(walletAddress!),
    enabled: !!walletAddress,
    staleTime: 15_000,
  });
}

/** Native-token transfers touching the wallet, from Soroban RPC events. */
export function useTransactions(walletAddress?: string | null) {
  return useQuery({
    queryKey: walletKeys.txs(walletAddress),
    queryFn: () => walletSdk.getRecentTransfers(walletAddress!, 25),
    enabled: !!walletAddress,
    staleTime: 20_000,
  });
}

export function useTransactionStatus(txHash?: string) {
  return useQuery({
    queryKey: walletKeys.txStatus(txHash),
    queryFn: () => walletSdk.getTransactionStatus(txHash!),
    enabled: !!txHash,
    refetchInterval: (q) => (q.state.data?.status === "pending" || !q.state.data ? 3_000 : false),
  });
}

export interface SendParams {
  walletAddress: string;
  credentialId: string;
  to: string;
  /** Decimal XLM string */
  amount: string;
}

/**
 * Send XLM: the SDK builds the Soroban transfer, the passkey signs the wallet's
 * auth entry (verified on-chain by the wallet contract) and the relay pays the fee.
 */
export function useSendTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ walletAddress, credentialId, to, amount }: SendParams) =>
      walletSdk.transfer({ walletAddress, to, amount: toStroops(amount), credentialId }),
    onSuccess: (_res, { walletAddress }) => {
      qc.invalidateQueries({ queryKey: walletKeys.state(walletAddress) });
      qc.invalidateQueries({ queryKey: walletKeys.txs(walletAddress) });
    },
  });
}

/** Testnet: relay sends XLM to the wallet. */
export function useFaucet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) => walletSdk.requestFaucet(walletAddress),
    onSuccess: (_res, walletAddress) => {
      qc.invalidateQueries({ queryKey: walletKeys.state(walletAddress) });
      qc.invalidateQueries({ queryKey: walletKeys.txs(walletAddress) });
    },
  });
}
