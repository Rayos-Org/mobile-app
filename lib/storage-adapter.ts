import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { StorageAdapter } from "@rayos/wallet-sdk";

// expo-secure-store keys must match /^[a-zA-Z0-9._-]+$/
function sanitizeKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 255);
}

/**
 * Keychain (iOS) / Keystore (Android) backed storage. Never holds private key
 * material — passkeys live in the secure enclave — but session metadata and the
 * signed-in wallet address are still protected.
 *
 * On web (dev preview / Playwright) SecureStore has no implementation, so we
 * fall back to localStorage. Web is not a shipping target for this app.
 */
const webStorage: StorageAdapter = {
  async getItem(key) {
    try {
      return globalThis.localStorage?.getItem(sanitizeKey(key)) ?? null;
    } catch {
      return null;
    }
  },
  async setItem(key, value) {
    try {
      globalThis.localStorage?.setItem(sanitizeKey(key), value);
    } catch {
      /* ignore */
    }
  },
  async removeItem(key) {
    try {
      globalThis.localStorage?.removeItem(sanitizeKey(key));
    } catch {
      /* ignore */
    }
  },
};

const nativeStorage: StorageAdapter = {
  async getItem(key) {
    return SecureStore.getItemAsync(sanitizeKey(key));
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(sanitizeKey(key), value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(sanitizeKey(key));
  },
};

export const secureStorageAdapter: StorageAdapter =
  Platform.OS === "web" ? webStorage : nativeStorage;
