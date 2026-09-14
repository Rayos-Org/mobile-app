// Polyfills required by @stellar/stellar-sdk on React Native. Imported first
// from app/_layout.tsx so they are installed before any SDK module evaluates.
import "react-native-get-random-values";
import { Buffer } from "buffer";

if (typeof globalThis.Buffer === "undefined") globalThis.Buffer = Buffer;
