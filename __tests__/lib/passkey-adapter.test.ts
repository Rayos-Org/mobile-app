import * as Passkeys from "react-native-passkeys";
import { createCredential, getAssertion, PasskeyCancelledError } from "@/native/passkey-adapter";

const create = Passkeys.create as jest.Mock;
const get = Passkeys.get as jest.Mock;

// Minimal packed attestationObject with an ES256 COSE key (x=0xaa…, y=0xbb…).
function fakeAttestationObject(): string {
  const x = new Uint8Array(32).fill(0xaa);
  const y = new Uint8Array(32).fill(0xbb);
  const cose = Uint8Array.from([
    0xa5,
    0x01,
    0x02,
    0x03,
    0x26,
    0x20,
    0x01,
    0x21,
    0x58,
    0x20,
    ...x,
    0x22,
    0x58,
    0x20,
    ...y,
  ]);
  const authData = Uint8Array.from([
    ...new Uint8Array(32),
    0x41,
    0,
    0,
    0,
    1,
    ...new Uint8Array(16),
    0x00,
    0x02,
    0xde,
    0xad,
    ...cose,
  ]);
  const str = (s: string) => Uint8Array.from([0x60 + s.length, ...Buffer.from(s)]);
  const att = Uint8Array.from([
    0xa3,
    ...str("fmt"),
    ...str("none"),
    ...str("attStmt"),
    0xa0,
    ...str("authData"),
    0x58,
    authData.length,
    ...authData,
  ]);
  return Buffer.from(att).toString("base64url");
}

describe("native passkey adapter", () => {
  beforeEach(() => {
    create.mockReset();
    get.mockReset();
  });

  it("maps registration results to the SDK PasskeyCredential shape and extracts the P-256 key", async () => {
    create.mockResolvedValue({
      id: "cred-1",
      rawId: "cred-1",
      response: { clientDataJSON: "cdj", attestationObject: fakeAttestationObject() },
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
    });
    expect(cred.publicKeyBytes).toHaveLength(65);
    expect(cred.publicKeyBytes[0]).toBe(0x04);
    expect(cred.publicKeyBytes[1]).toBe(0xaa);
    expect(cred.publicKeyBytes[33]).toBe(0xbb);
    // Platform, resident, user-verified, ES256-only are enforced.
    expect(create.mock.calls[0][0].authenticatorSelection).toMatchObject({
      authenticatorAttachment: "platform",
      residentKey: "required",
      userVerification: "required",
    });
    expect(create.mock.calls[0][0].pubKeyCredParams).toEqual([{ type: "public-key", alg: -7 }]);
  });

  it("returns the WebAuthn assertion fields the SDK signs Soroban auth entries with", async () => {
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

    const assertion = await getAssertion({ challenge: "c", credentialId: "cred-1" });
    expect(assertion.response).toEqual({
      authenticatorData: "ad",
      clientDataJSON: "cdj",
      signature: "sig",
      userHandle: undefined,
    });
    expect(get.mock.calls[0][0].challenge).toBe("c");
    expect(get.mock.calls[0][0].allowCredentials).toEqual([{ type: "public-key", id: "cred-1" }]);
  });

  it("allows discoverable sign-in with no credential id", async () => {
    get.mockResolvedValue({
      id: "x",
      rawId: "x",
      response: { authenticatorData: "", clientDataJSON: "", signature: "" },
    });
    await getAssertion({ challenge: "c" });
    expect(get.mock.calls[0][0].allowCredentials).toEqual([]);
  });

  it("normalises user cancellation", async () => {
    get.mockRejectedValue(new Error("UserCancelled"));
    await expect(getAssertion({ challenge: "c", credentialId: "id" })).rejects.toBeInstanceOf(
      PasskeyCancelledError
    );
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
