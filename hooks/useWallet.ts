import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubmitTransactionResponse } from "@rayos/wallet-sdk";
import { walletSdk } from "@/lib/sdk-client";
import { api, horizon } from "@/lib/api";
import { config, NATIVE_XLM_CONTRACT_ID } from "@/lib/config";
import { assertWithPasskey } from "@/lib/webauthn";

export const walletKeys = {
  state: (addr: string | null | undefined) => ["wallet", addr] as const,
  exists: (addr: string | null | undefined) => ["account-exists", addr] as const,
  txs: (addr: string | null | undefined) => ["transactions", addr] as const,
  txStatus: (hash: string | undefined) => ["tx-status", hash] as const,
};

/** Signers + native balance straight from the Soroban contract via the SDK. */
export function useWallet(walletAddress?: string | null) {
  return useQuery({
    queryKey: walletKeys.state(walletAddress),
    queryFn: () => walletSdk.getWalletState(walletAddress!, { contractId: NATIVE_XLM_CONTRACT_ID }),
    enabled: !!walletAddress,
    staleTime: 15_000,
  });
}

/** Whether the account has been funded (Horizon 404 = not yet created). */
export function useAccountExists(walletAddress?: string | null) {
  return useQuery({
    queryKey: walletKeys.exists(walletAddress),
    queryFn: async () => {
      try {
        await horizon(`/accounts/${walletAddress}`);
        return true;
      } catch (e: any) {
        if (e?.status === 404) return false;
        throw e;
      }
    },
    enabled: !!walletAddress,
    retry: false,
  });
}

export interface HorizonOperation {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  from?: string;
  to?: string;
  amount?: string;
  starting_balance?: string;
  asset_type?: string;
  asset_code?: string;
  source_account?: string;
}

export function useTransactions(walletAddress?: string | null) {
  return useQuery({
    queryKey: walletKeys.txs(walletAddress),
    queryFn: async (): Promise<HorizonOperation[]> => {
      try {
        const json = await horizon<{ _embedded?: { records?: HorizonOperation[] } }>(
          `/accounts/${walletAddress}/operations?limit=25&order=desc`
        );
        return json._embedded?.records ?? [];
      } catch (e: any) {
        if (e?.status === 404) return [];
        throw e;
      }
    },
    enabled: !!walletAddress,
    staleTime: 20_000,
  });
}

export function useTransactionStatus(txHash?: string) {
  return useQuery({
    queryKey: walletKeys.txStatus(txHash),
    queryFn: () => api<{ hash: string; status: "pending" | "success" | "failed" }>(`/relay/status/${txHash}`),
    enabled: !!txHash,
    refetchInterval: (q) => (q.state.data?.status === "pending" || !q.state.data ? 3_000 : false),
  });
}

export interface SendParams {
  walletAddress: string;
  credentialId: string;
  userHandle: string;
  to: string;
  amount: string;
}

/**
 * Send XLM: passkey assertion → SDK signAndSubmit → relay. Same shape as
 * QuickSend on the web dashboard; the SDK builds the XDR from the payload.
 */
export function useSendTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ walletAddress, credentialId, userHandle, to, amount }: SendParams) => {
      const { challenge } = await assertWithPasskey(userHandle, credentialId, "send");
      const xdr = JSON.stringify({ from: walletAddress, to, amount, asset: "native" });
      return walletSdk.signAndSubmit(xdr, {
        challenge,
        credentialId,
        rpId: config.WEBAUTHN_RP_ID,
      }) as Promise<SubmitTransactionResponse>;
    },
    onSuccess: (_res, { walletAddress }) => {
      // Balance + history refresh once the relay has accepted the tx.
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: walletKeys.state(walletAddress) });
        qc.invalidateQueries({ queryKey: walletKeys.txs(walletAddress) });
      }, 4_000);
    },
  });
}
