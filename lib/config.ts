import { z } from "zod";

/**
 * Runtime config. Every value is an EXPO_PUBLIC_* env var inlined at build
 * time (see .env.example and eas.json `build.*.env`). Validation happens once
 * at import so a misconfigured build fails loudly on launch, not mid-flow.
 */
const schema = z.object({
  RELAY_BACKEND_URL: z.string().url(),
  SOROBAN_RPC_URL: z.string().url(),
  STELLAR_NETWORK_PASSPHRASE: z.string().min(1),
  FACTORY_CONTRACT_ID: z.string().length(56),
  POLICY_CONTRACT_ID: z.string().length(56),
  WEBAUTHN_RP_ID: z.string().min(1),
  HORIZON_URL: z.string().url(),
});

export type AppConfig = z.infer<typeof schema>;

const parsed = schema.safeParse({
  RELAY_BACKEND_URL: process.env.EXPO_PUBLIC_RELAY_BACKEND_URL,
  SOROBAN_RPC_URL: process.env.EXPO_PUBLIC_SOROBAN_RPC_URL,
  STELLAR_NETWORK_PASSPHRASE: process.env.EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
  FACTORY_CONTRACT_ID: process.env.EXPO_PUBLIC_FACTORY_CONTRACT_ID,
  POLICY_CONTRACT_ID: process.env.EXPO_PUBLIC_POLICY_CONTRACT_ID,
  WEBAUTHN_RP_ID: process.env.EXPO_PUBLIC_WEBAUTHN_RP_ID,
  HORIZON_URL: process.env.EXPO_PUBLIC_HORIZON_URL,
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => `EXPO_PUBLIC_${i.path.join(".")}: ${i.message}`);
  throw new Error(
    `Invalid app configuration. Copy .env.example to .env and fill in:\n  ${missing.join("\n  ")}`
  );
}

export const config: AppConfig = parsed.data;

/** Native XLM Stellar Asset Contract on testnet — same as web-dashboard. */
export const NATIVE_XLM_CONTRACT_ID = "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

export const EXPLORER_URL = "https://stellar.expert/explorer/testnet";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
