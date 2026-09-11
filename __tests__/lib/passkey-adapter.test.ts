import * as Passkeys from "react-native-passkeys";
import { createCredential, PasskeyCancelledError, signTransaction } from "@/native/passkey-adapter";

const create = Passkeys.create as jest.Mock;
const get = Passkeys.get as jest.Mock;

describe("native passkey adapter", () => {
  beforeEach(() => {
    create.mockReset();
    get.mockReset();
  });

  it("maps registration results to the SDK PasskeyCredential shape", async () => {
    create.mockResolvedValue({
      id: "cred-1",
      rawId: "cred-1",
      response: { clientDataJSON: "cdj", attestationObject: "att" },
    });

    const cred = await createCredential({
      challenge: "chal",
      rp: { id: "relay.test", name: "Guardian" },
      user: { id: "u", name: "n", displayName: "n" },
    });

    expect(cred).toMatchObject({
      id: "cred-1",
      type: "public-key",
      authenticatorAttachment: "platform",
      response: { clientDataJSON: "cdj", attestationObject: "att" },
    });
    expect(cred.publicKeyBytes).toBeInstanceOf(Uint8Array);
    // Platform, resident, user-verified defaults are enforced.
    expect(create.mock.calls[0][0].authenticatorSelection).toMatchObject({
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    });
  });

  it("returns the XDR as signedXdr so WalletSdk.signAndSubmit can relay it", async () => {
    get.mockResolvedValue({
      id: "cred-1",
      rawId: "cred-1",
      response: {
        authenticatorData: "ad",
        clientDataJSON: "cdj",
        signature: "sig",
        userHandle: null,
      },
    });

    const assertion = await signTransaction("XDR-BYTES", {
      challenge: "c",
      credentialId: "cred-1",
    });
    expect(assertion.signedXdr).toBe("XDR-BYTES");
    expect(assertion.response.signature).toBe("sig");
    expect(assertion.response.userHandle).toBeUndefined();
    expect(get.mock.calls[0][0].allowCredentials).toEqual([{ type: "public-key", id: "cred-1" }]);
  });

  it("allows discoverable sign-in with no credential id", async () => {
    get.mockResolvedValue({
      id: "x",
      rawId: "x",
      response: { authenticatorData: "", clientDataJSON: "", signature: "" },
    });
    await signTransaction("login", { challenge: "c", credentialId: "" });
    expect(get.mock.calls[0][0].allowCredentials).toEqual([]);
  });

  it("normalises user cancellation", async () => {
    get.mockRejectedValue(new Error("UserCancelled"));
    await expect(
      signTransaction("x", { challenge: "c", credentialId: "id" })
    ).rejects.toBeInstanceOf(PasskeyCancelledError);
    create.mockResolvedValue(null);
    await expect(
      createCredential({
        challenge: "c",
        rp: { id: "r", name: "n" },
        user: { id: "u", name: "n", displayName: "n" },
      })
    ).rejects.toBeInstanceOf(PasskeyCancelledError);
  });
});
