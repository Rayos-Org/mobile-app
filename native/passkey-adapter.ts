import * as Passkeys from "react-native-passkeys";
import type {
  PasskeyAssertion,
  PasskeyCredential,
  PasskeyProvider,
  PasskeyRegistrationOptions,
  PasskeySignOptions,
} from "@rayos/wallet-sdk";
import { config } from "@/lib/config";

/**
 * Native `PasskeyProvider` for @rayos/wallet-sdk.
 *
 * The SDK's browser implementation wraps @simplewebauthn/browser; this one
 * wraps react-native-passkeys (ASAuthorization on iOS, Credential Manager on
 * Android). Both return the same JSON shapes so everything above this seam
 * (hooks, flows) is identical to the web dashboard.
 *
 * Passkeys only work on-device when the relying party serves
 *   /.well-known/apple-app-site-association  and  /.well-known/assetlinks.json
 * for `config.WEBAUTHN_RP_ID` — relay-backend's WellKnownController does this.
 */

export class PasskeyUnsupportedError extends Error {
  constructor() {
    super(
      "Passkeys are not supported on this device. iOS 16+ or Android 9+ with Google Play services is required."
    );
    this.name = "PasskeyUnsupportedError";
  }
}

export class PasskeyCancelledError extends Error {
  constructor() {
    super("Passkey prompt was cancelled.");
    this.name = "PasskeyCancelledError";
  }
}

export function isPasskeySupported(): boolean {
  try {
    return Passkeys.isSupported();
  } catch {
    return false;
  }
}

function normaliseError(err: unknown): Error {
  const msg = err instanceof Error ? err.message : String(err);
  if (/cancel|abort|UserCancelled|1001/i.test(msg)) return new PasskeyCancelledError();
  if (/not supported|unsupported/i.test(msg)) return new PasskeyUnsupportedError();
  return err instanceof Error ? err : new Error(msg);
}

export async function createCredential(
  options: PasskeyRegistrationOptions
): Promise<PasskeyCredential> {
  if (!isPasskeySupported()) throw new PasskeyUnsupportedError();

  let result: Awaited<ReturnType<typeof Passkeys.create>>;
  try {
    result = await Passkeys.create({
      challenge: options.challenge,
      rp: { id: options.rp.id || config.WEBAUTHN_RP_ID, name: options.rp.name },
      user: options.user,
      pubKeyCredParams: options.pubKeyCredParams ?? [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: options.timeout ?? 60_000,
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        residentKey: "required",
        requireResidentKey: true,
        userVerification: "required",
        ...options.authenticatorSelection,
      },
      attestation: options.attestation ?? "none",
    });
  } catch (err) {
    throw normaliseError(err);
  }
  if (!result) throw new PasskeyCancelledError();

  return {
    id: result.id,
    rawId: result.rawId,
    type: "public-key",
    authenticatorAttachment: "platform",
    clientExtensionResults: {},
    response: {
      clientDataJSON: result.response.clientDataJSON,
      attestationObject: result.response.attestationObject,
    },
    // Matches the SDK's browser provider: the contract-formatted key is derived
    // server-side from attestationObject; the SDK only needs the field present.
    publicKeyBytes: new Uint8Array(32),
  };
}

export async function signTransaction(
  xdr: string,
  options: PasskeySignOptions
): Promise<PasskeyAssertion> {
  if (!isPasskeySupported()) throw new PasskeyUnsupportedError();

  let result: Awaited<ReturnType<typeof Passkeys.get>>;
  try {
    result = await Passkeys.get({
      challenge: options.challenge,
      rpId: options.rpId ?? config.WEBAUTHN_RP_ID,
      allowCredentials: options.credentialId
        ? [{ type: "public-key", id: options.credentialId }]
        : [],
      timeout: options.timeout ?? 60_000,
      userVerification: options.userVerification ?? "required",
    });
  } catch (err) {
    throw normaliseError(err);
  }
  if (!result) throw new PasskeyCancelledError();

  return {
    id: result.id,
    rawId: result.rawId,
    type: "public-key",
    clientExtensionResults: {},
    response: {
      authenticatorData: result.response.authenticatorData,
      clientDataJSON: result.response.clientDataJSON,
      signature: result.response.signature,
      userHandle: result.response.userHandle ?? undefined,
    },
    // Same contract as the SDK's browser provider: the relay attaches the
    // assertion to the XDR envelope; we hand back the XDR we were asked to sign.
    signedXdr: xdr,
  };
}

export const nativePasskeyProvider: PasskeyProvider = { createCredential, signTransaction };
