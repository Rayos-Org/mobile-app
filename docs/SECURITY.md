# Security Policy — Rayos Mobile App

## Supported Versions

| Version | Supported |
|---|---|
| Latest `main` | ✅ |
| Tagged releases | ✅ |
| Older branches | ❌ |

## Reporting a Vulnerability

**Please do not file a public GitHub issue for security vulnerabilities.**

Report security issues privately via GitHub's **Security Advisory** feature:
👉 `https://github.com/Rayos-Org/mobile-app/security/advisories/new`

Include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

We will acknowledge within **48 hours** and aim to ship a patch within **7 days** for critical issues.

## Security Model

- **No key material ever leaves the device.** Passkeys are generated and stored in the Secure Enclave (iOS) / StrongBox (Android). `expo-secure-store` is used only for the session reference (`walletAddress` + `credentialId`).
- **Transactions are signed on-device** via the native biometric prompt. The signed XDR is submitted to the relay; the relay never sees a private key.
- **The relay is not trusted for auth.** WebAuthn challenges are verified server-side but the wallet contract itself verifies the WebAuthn signature on-chain via `__check_auth`.
- **`EXPO_PUBLIC_*` variables are not secrets** — they are baked into the JS bundle and are visible to anyone who decompiles the app. Never put private keys or secrets in env vars.
