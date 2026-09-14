import { WalletSdk } from "@rayos/wallet-sdk";
import { config } from "./config";
import { nativePasskeyProvider } from "@/native/passkey-adapter";

/** Singleton SDK instance — same SDK as web-dashboard, native passkey seam. */
export const walletSdk = new WalletSdk({
  networkPassphrase: config.STELLAR_NETWORK_PASSPHRASE,
  rpcUrl: config.SOROBAN_RPC_URL,
  relayUrl: config.RELAY_BACKEND_URL,
  factoryContractId: config.FACTORY_CONTRACT_ID,
  rpId: config.WEBAUTHN_RP_ID,
  passkeyProvider: nativePasskeyProvider,
});
