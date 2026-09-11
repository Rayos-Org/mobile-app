import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureStorageAdapter } from "@/lib/storage-adapter";

export interface AuthSession {
  walletAddress: string;
  credentialId: string;
  userHandle?: string;
  walletName?: string;
}

export interface AuthState {
  walletAddress: string | null;
  credentialId: string | null;
  /** WebAuthn user handle used at registration — scopes relay challenges. */
  userHandle: string | null;
  walletName: string | null;
  /** True once the persisted state has been read from SecureStore. */
  hydrated: boolean;
  setAuth: (session: AuthSession) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      walletAddress: null,
      credentialId: null,
      userHandle: null,
      walletName: null,
      hydrated: false,
      setAuth: ({ walletAddress, credentialId, userHandle, walletName }) =>
        set((s) => ({
          walletAddress,
          credentialId,
          userHandle: userHandle ?? s.userHandle,
          walletName: walletName ?? s.walletName,
        })),
      // Keep userHandle/walletName so "Sign in" on this device is one tap.
      clearAuth: () => set({ walletAddress: null, credentialId: null }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "rayos_auth",
      storage: createJSONStorage(() => secureStorageAdapter),
      partialize: (s) => ({
        walletAddress: s.walletAddress,
        credentialId: s.credentialId,
        userHandle: s.userHandle,
        walletName: s.walletName,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    }
  )
);
