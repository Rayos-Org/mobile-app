import { useAuthStore } from "@/store/auth";

describe("auth store", () => {
  beforeEach(() =>
    useAuthStore.setState({
      walletAddress: null,
      credentialId: null,
      userHandle: null,
      walletName: null,
    })
  );

  it("stores a session and keeps device hints after sign-out", () => {
    useAuthStore.getState().setAuth({
      walletAddress: "G".padEnd(56, "A"),
      credentialId: "cred",
      userHandle: "uh",
      walletName: "Personal",
    });
    expect(useAuthStore.getState().walletAddress).toHaveLength(56);

    useAuthStore.getState().clearAuth();
    const s = useAuthStore.getState();
    expect(s.walletAddress).toBeNull();
    expect(s.credentialId).toBeNull();
    // Retained so "Sign in" on the same device is one tap.
    expect(s.userHandle).toBe("uh");
    expect(s.walletName).toBe("Personal");
  });

  it("does not overwrite userHandle with undefined on re-login", () => {
    useAuthStore.getState().setAuth({ walletAddress: "G", credentialId: "c", userHandle: "first" });
    useAuthStore.getState().setAuth({ walletAddress: "G", credentialId: "c2" });
    expect(useAuthStore.getState().userHandle).toBe("first");
    expect(useAuthStore.getState().credentialId).toBe("c2");
  });
});
