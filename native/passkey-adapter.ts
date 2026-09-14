import * as Passkeys from "react-native-passkeys";
import {
  publicKeyFromAttestationObject,
  type PasskeyAssertion,
  type PasskeyAssertionOptions,
  type PasskeyCredential,
  type PasskeyProvider,
  type PasskeyRegistrationOptions,
} from "@rayos/wallet-sdk";
import { config } from "@/lib/config";

/**
 * Native `PasskeyProvider` for @rayos/wallet-sdk.
 *
 * The SDK's browser implementation wraps @simplewebauthn/browser; this one
 * wraps react-native-passkeys (ASAuthorization on iOS, Credential Manager on
 * Android). Both return standard WebAuthn JSON, so the SDK does the Stellar
 * work (P-256 key extraction, Soroban auth-entry signing) identically.
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
      // ES256 only — the wallet contract verifies P-256 signatures.
      pubKeyCredParams: [{ type: "public-key", alg: -7 }],
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
    // The contract-formatted (uncompressed P-256) key, parsed from the attestation.
    publicKeyBytes: publicKeyFromAttestationObject(result.response.attestationObject),
  };
}

/**
 * WebAuthn assertion over an arbitrary challenge. For on-chain authorisation
 * the SDK passes the Soroban signature payload as the challenge; the wallet
 * contract verifies the resulting signature.
 */
export async function getAssertion(options: PasskeyAssertionOptions): Promise<PasskeyAssertion> {
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
  };
}

export const nativePasskeyProvider: PasskeyProvider = { createCredential, getAssertion };
