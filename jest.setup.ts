// Native modules that have no JS fallback in the jest-expo environment.
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

jest.mock(
  "react-native-safe-area-context",
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("react-native-safe-area-context/jest/mock").default
);

jest.mock("react-native-passkeys", () => ({
  isSupported: () => true,
  create: jest.fn(),
  get: jest.fn(),
}));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Error: "error", Warning: "warning" },
}));

jest.mock("expo-linear-gradient", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View } = require("react-native");
  return { LinearGradient: (props: any) => React.createElement(View, props, props.children) };
});

// Config is read from EXPO_PUBLIC_* at import time.
process.env.EXPO_PUBLIC_RELAY_BACKEND_URL ??= "https://relay.test/api";
process.env.EXPO_PUBLIC_SOROBAN_RPC_URL ??= "https://soroban-testnet.stellar.org";
process.env.EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??= "Test SDF Network ; September 2015";
process.env.EXPO_PUBLIC_FACTORY_CONTRACT_ID ??=
  "CCCAMWJOF7IYTVCU7SR6HFTNH5XRMDMWPYN464NY5BCKUPMUM64RZ5CH";
process.env.EXPO_PUBLIC_POLICY_CONTRACT_ID ??=
  "CCDM3O2SXX3E24MCWLRK5YBVQHJCA4OQKJFF6KWCK6FHZS65DGMT6DOY";
process.env.EXPO_PUBLIC_WEBAUTHN_RP_ID ??= "relay.test";
process.env.EXPO_PUBLIC_HORIZON_URL ??= "https://horizon-testnet.stellar.org";
