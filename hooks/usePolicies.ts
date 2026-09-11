import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { assertWithPasskey } from "@/lib/webauthn";

export interface SessionKey {
  sessionId: string;
  walletAddress: string;
  scope: string;
  expiresAt: string;
  createdAt: string;
}

export const policyKeys = {
  sessions: (addr: string | null | undefined) => ["sessions", addr] as const,
};

export function useSessionKeys(walletAddress?: string | null) {
  return useQuery({
    queryKey: policyKeys.sessions(walletAddress),
    queryFn: () =>
      api<SessionKey[]>(`/sessions?walletAddress=${encodeURIComponent(walletAddress!)}`),
    enabled: !!walletAddress,
  });
}

export interface CreateSessionParams {
  walletAddress: string;
  credentialId: string;
  userHandle: string;
  scope: string;
  expiresAt: string;
}

/** Passkey-signed session key authorisation, then persisted on the relay. */
export function useCreateSessionKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      walletAddress,
      credentialId,
      userHandle,
      scope,
      expiresAt,
    }: CreateSessionParams) => {
      const { assertion } = await assertWithPasskey(userHandle, credentialId, "session");
      return api<SessionKey>("/sessions", {
        method: "POST",
        body: { walletAddress, scope, expiresAt, signature: assertion.response.signature },
      });
    },
    onSuccess: (_, { walletAddress }) =>
      qc.invalidateQueries({ queryKey: policyKeys.sessions(walletAddress) }),
  });
}

export function useRevokeSessionKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, walletAddress }: { id: string; walletAddress: string }) =>
      api(
        `/sessions/${encodeURIComponent(id)}?walletAddress=${encodeURIComponent(walletAddress)}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (_, { walletAddress }) =>
      qc.invalidateQueries({ queryKey: policyKeys.sessions(walletAddress) }),
  });
}

/**
 * Spend-limit and allow-list mutations are enforced on-chain by the policy
 * module. The SDK does not yet expose `set_spend_limit` / `set_allow_list`,
 * so — exactly like the web dashboard — we perform the passkey ceremony now
 * and keep the values locally until the SDK method lands.
 */
export function useSignPolicyChange() {
  return useMutation({
    mutationFn: async ({
      credentialId,
      userHandle,
    }: {
      credentialId: string;
      userHandle: string;
    }) => {
      const { assertion } = await assertWithPasskey(userHandle, credentialId, "policy");
      return assertion;
    },
  });
}
