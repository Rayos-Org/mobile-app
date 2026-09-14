import * as Crypto from "expo-crypto";
import type { PasskeyAssertion, PasskeyRegistrationOptions } from "@rayos/wallet-sdk";
import { api } from "./api";
import { config } from "./config";
import { getAssertion } from "@/native/passkey-adapter";

/**
 * WebAuthn ceremonies against relay-backend — identical endpoints/payloads to
 * web-dashboard. Transaction signing does NOT go through here: the SDK signs
 * Soroban auth entries with the passkey directly (see walletSdk.transfer).
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

export async function verifyAssertion(userHandle: string, response: unknown) {
  return api<{ verified: boolean; credentialId: string }>("/webauthn/assert/verify", {
    method: "POST",
    body: { userHandle, response },
  });
}

/**
 * Relay-challenged passkey assertion (sign-in / off-chain authorisations).
 * `credentialId` may be omitted for discoverable sign-in (OS shows a picker).
 */
export async function assertWithPasskey(
  userHandle: string,
  credentialId?: string
): Promise<{ assertion: PasskeyAssertion; challenge: string }> {
  const options = await getAssertionOptions(userHandle);
  const assertion = await getAssertion({
    challenge: options.challenge,
    credentialId,
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
