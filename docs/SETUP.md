# Setup Guide — Rayos Mobile App

> Complete local development setup from zero to running on a real device or simulator.

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 20 | [nodejs.org](https://nodejs.org) |
| pnpm | ≥ 9 | `npm i -g pnpm` |
| Expo CLI | latest | included via `pnpm` scripts |
| EAS CLI | latest | `npm i -g eas-cli` |
| Xcode | ≥ 15 (macOS only) | App Store |
| Android Studio | Hedgehog+ | [developer.android.com](https://developer.android.com/studio) |
| Maestro | latest | `curl -Ls "https://get.maestro.mobile.dev" | bash` |

---

## 1. Clone & Install

```bash
# Clone the entire org so the file: dependency resolves correctly
git clone https://github.com/Rayos-Org/wallet-sdk.git
git clone https://github.com/Rayos-Org/mobile-app.git

# Build wallet-sdk first (it's a file: dep)
cd wallet-sdk
pnpm install
pnpm build
cd ../mobile-app

# Install mobile-app deps
pnpm install
```

> **How the SDK is consumed.** `package.json` pins `@rayos/wallet-sdk` to a packed tarball in
> `vendor/` (`file:vendor/rayos-wallet-sdk-<version>.tgz`). EAS Build and GitHub Actions only see
> this repo, so a `file:../wallet-sdk` link cannot resolve there — the tarball travels with the
> repo instead. The npm release (`0.1.1`) predates the `PasskeyProvider` seam this app needs.
>
> After pulling SDK changes, re-vendor from the sibling checkout and commit `vendor/` + the lockfile:
>
> ```bash
> pnpm sdk:vendor && pnpm install
> ```
>
> Once a newer SDK is published to npm, switch the dependency back to a semver range and delete `vendor/`.

---

## 2. Environment Variables

```bash
cp .env.example .env
```

Open `.env` and verify/update:

| Variable | Default | Notes |
|---|---|---|
| `EXPO_PUBLIC_RELAY_BACKEND_URL` | `http://localhost:3000/api` | Change to `https://relay-staging.rayos.dev/api` for deployed backend |
| `EXPO_PUBLIC_SOROBAN_RPC_URL` | `https://soroban-testnet.stellar.org` | Testnet RPC |
| `EXPO_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | Never change for testnet |
| `EXPO_PUBLIC_FACTORY_CONTRACT_ID` | `CCCAMWJ…` | Testnet factory contract |
| `EXPO_PUBLIC_POLICY_CONTRACT_ID` | `CCDM3O…` | Testnet policy contract |
| `EXPO_PUBLIC_WEBAUTHN_RP_ID` | `relay-staging.rayos.dev` | **Must match** relay-backend `WEBAUTHN_RP_ID` |
| `EXPO_PUBLIC_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Testnet Horizon |

> All `EXPO_PUBLIC_*` variables are **not secret** and are baked into the JS bundle at build time.

---

## 3. Start the Dev Server

### Simulator / Emulator (quickest)

```bash
pnpm ios        # Xcode simulator (macOS only)
pnpm android    # Android emulator
```

> **Note:** Passkeys do **not** work on simulators/emulators — biometric ceremonies require a real device.
> Use the simulator to develop UI and all non-passkey flows.

### Development Build (real device — passkeys work)

```bash
# Build the dev client once (EAS — requires EXPO_TOKEN)
pnpm build:dev

# Then start Metro
pnpm start

# Scan the QR code with the installed dev client on your device
```

---

## 4. Passkeys on Real Devices

Passkeys silently fail without domain verification. Do these steps before testing on a real device:

### iOS — Apple App Site Association

1. Get your Apple **Team ID** from [developer.apple.com](https://developer.apple.com/account) → Membership.
2. Open `relay-backend/src/modules/well-known/well-known.controller.ts`.
3. Replace `TEAMID` with your real Team ID in the AASA response.
4. Deploy `relay-backend` so `https://<PASSKEY_DOMAIN>/.well-known/apple-app-site-association` is live.
5. Verify with: `curl -s https://<PASSKEY_DOMAIN>/.well-known/apple-app-site-association | jq .`

### Android — Digital Asset Links

1. Run: `eas credentials -p android` → select your keystore → copy the **SHA-256 fingerprint**.
2. Open `relay-backend/src/modules/well-known/well-known.controller.ts`.
3. Replace the placeholder `00:00:…` with your real fingerprint.
4. Deploy `relay-backend` so `https://<PASSKEY_DOMAIN>/.well-known/assetlinks.json` is live.
5. Verify with: `adb shell pm get-app-links --user cur dev.rayos.wallet`

> **Bundle ID suffixes:** Dev builds use `dev.rayos.wallet.development`, preview uses `dev.rayos.wallet.preview`. Add each bundle ID to both AASA and assetlinks so all three environments work simultaneously.

---

## 5. Run Quality Checks

```bash
pnpm typecheck          # tsc --noEmit (strict)
pnpm lint               # eslint-config-expo
pnpm format:check       # prettier
pnpm test               # jest (unit + component)
pnpm doctor             # expo-doctor — checks SDK/package compatibility
pnpm export             # expo export --platform web (Metro smoke test)
pnpm e2e                # maestro test e2e/flows (device/simulator must be running)
```

All checks except `e2e` run automatically in CI on every PR.

---

## 6. EAS Setup (first time only)

```bash
eas login                    # expo.dev account
eas init                     # only if you fork: links a new project (id is baked into app.config.ts)
eas credentials -p ios       # provision distribution cert + provisioning profile
eas credentials -p android   # generate Android keystore
```

Then add these GitHub secrets/variables to the repo:

| Type | Name | Where to get it |
|---|---|---|
| Secret | `EXPO_TOKEN` | expo.dev → Access Tokens → Create |
| Secret | `EAS_PROJECT_ID` | optional — overrides the id baked into `app.config.ts` (`6113f1c7-…`, rayos-organization/rayos-wallet) |
| Variable | `EXPO_OWNER` | your expo.dev org slug |
| Secret | `APPLE_ID` | your Apple ID email |
| Secret | `ASC_APP_ID` | App Store Connect → App → App Information → Apple ID |
| Secret | `APPLE_TEAM_ID` | developer.apple.com → Membership |
| Secret | `EXPO_APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com → App-Specific Passwords |
| Secret | `GOOGLE_SERVICE_ACCOUNT_JSON` | Google Play Console → Setup → API access → JSON key |

> Create a `production-stores` **GitHub Environment** with required reviewers. This is the manual gate before `eas submit`.

---

## 7. OTA Updates

```bash
# Push JS-only fix to preview testers
pnpm update:preview -- "Fix XLM display precision"

# Push to production (triggers manual dispatch in GitHub Actions)
# or run directly:
eas update --channel production --message "Patch guardian approval banner"
```

> OTA updates only work for JS changes. Any native module change (passkey adapter, new Expo module) requires a full `eas build`.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Passkey creation fails silently on device | AASA / assetlinks not live or wrong Team ID / fingerprint | See §4 |
| `ERR_PNPM_WORKSPACE_PKG_NOT_FOUND` | `wallet-sdk` not checked out as sibling | Clone at same level, run `pnpm build` |
| Metro bundler crash on `@simplewebauthn/browser` | SDK import pulled in browser WebAuthn polyfill | Ensure `native/passkey-adapter.ts` is used, not the web SDK passkey functions directly |
| Expo Go shows blank or errors | Native modules not supported in Expo Go | Use dev build: `pnpm build:dev` |
| Android emulator passkey fails | Credential Manager not available in emulator | Test on a real Android 9+ device with Play Services |
| `expo-doctor` warnings about peer deps | Minor version mismatches | Safe to ignore if CI passes; update with `npx expo install --check` |
