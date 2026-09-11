import * as Crypto from "expo-crypto";
import type { PasskeyAssertion, PasskeyRegistrationOptions } from "@rayos/wallet-sdk";
import { api } from "./api";
import { config } from "./config";
import { signTransaction } from "@/native/passkey-adapter";

/**
 * WebAuthn ceremonies against relay-backend. These mirror the fetch calls in
 * web-dashboard so both clients hit identical endpoints/payloads.
 */

export interface RegistrationVerifyResponse {
  verified: boolean;
  credentialId: string;
  publicKey: string;
}

export interface AssertionOptions {
  challenge: string;
  rpId?: string;
  timeout?: number;
  userVerification?: "required" | "preferred" | "discouraged";
  allowCredentials?: { id: string; type: "public-key" }[];
}

export function newUserHandle(): string {
  return Crypto.randomUUID();
}

export async function getRegistrationOptions(userHandle: string, userName: string) {
  return api<PasskeyRegistrationOptions>("/webauthn/register/options", {
    method: "POST",
    body: { userHandle, userName },
  });
}

export async function verifyRegistration(userHandle: string, response: unknown) {
  return api<RegistrationVerifyResponse>("/webauthn/register/verify", {
    method: "POST",
    body: { userHandle, response },
  });
}

export async function getAssertionOptions(userHandle: string) {
  return api<AssertionOptions>("/webauthn/assert/options", {
    method: "POST",
    body: { userHandle },
  });
}

/**
 * Prompt the platform authenticator and return the assertion. `credentialId`
 * may be omitted for discoverable-credential sign-in (the OS shows a picker).
 */
export async function assertWithPasskey(
  userHandle: string,
  credentialId?: string,
  purpose = "auth"
): Promise<{ assertion: PasskeyAssertion; challenge: string }> {
  const options = await getAssertionOptions(userHandle);
  const assertion = await signTransaction(purpose, {
    challenge: options.challenge,
    credentialId: credentialId ?? "",
    rpId: options.rpId ?? config.WEBAUTHN_RP_ID,
    timeout: options.timeout,
    userVerification: options.userVerification,
  });
  return { assertion, challenge: options.challenge };
}

export async function lookupWallet(credentialId: string) {
  return api<{ credentialId: string; walletAddress: string }>(
    `/wallets/${encodeURIComponent(credentialId)}`
  );
}
