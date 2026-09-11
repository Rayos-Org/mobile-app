import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { assertWithPasskey } from "@/lib/webauthn";

export interface RecoveryProposalStatus {
  proposalId: string;
  status: "pending" | "approved" | "executed" | "cancelled" | "expired";
  timelockExpiresAt: string;
  approvals: { guardianAddress: string; approvedAt: string }[];
}

export const recoveryKeys = {
  proposal: (id: string | null | undefined) => ["recovery", id] as const,
};

export function useRecoveryProposal(proposalId?: string | null) {
  return useQuery({
    queryKey: recoveryKeys.proposal(proposalId),
    queryFn: async (): Promise<RecoveryProposalStatus | null> => {
      try {
        return await api<RecoveryProposalStatus>(
          `/recovery/${encodeURIComponent(proposalId!)}/status`
        );
      } catch (e: any) {
        if (e?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!proposalId,
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "pending" || s === "approved" ? 10_000 : false;
    },
  });
}

export function useProposeRecovery() {
  return useMutation({
    mutationFn: ({ walletAddress, newSigner }: { walletAddress: string; newSigner: string }) =>
      api<{ proposalId?: string; id?: string }>("/recovery/propose", {
        method: "POST",
        body: { walletAddress, newSigner },
      }),
  });
}

export interface ApproveParams {
  walletAddress: string;
  proposalId: string;
  credentialId?: string;
  userHandle: string;
}

/** Guardian signs with their passkey, then the approval is recorded on the relay. */
export function useApproveRecovery() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ walletAddress, proposalId, credentialId, userHandle }: ApproveParams) => {
      await assertWithPasskey(userHandle, credentialId, "recovery");
      return api("/recovery/approve", { method: "POST", body: { walletAddress, proposalId } });
    },
    onSuccess: (_, { proposalId }) =>
      qc.invalidateQueries({ queryKey: recoveryKeys.proposal(proposalId) }),
  });
}
