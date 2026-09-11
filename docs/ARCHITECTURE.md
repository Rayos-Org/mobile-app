# Architecture — Rayos Mobile App

> **`@rayos/mobile-app`** — Native iOS & Android wallet experience built with React Native + Expo.

---

## 1. Purpose & Scope

The mobile app is the native sibling of [`web-dashboard`](https://github.com/Rayos-Org/web-dashboard). It delivers the same wallet management features — create wallet, send assets, configure policies, manage guardian recovery — but through **native biometrics** (Face ID / Touch ID / Android biometric prompts) via the Passkeys API, which feels dramatically more native and polished on mobile than a browser-based flow.

This is where the "seedless wallet" pitch is most convincing: there is nothing to back up, no seed phrase to write down, no password to forget.

---

## 2. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React Native 0.86 + Expo SDK 57 | Managed workflow, single codebase for iOS + Android |
| Routing | `expo-router` v57 | File-based routes, `Stack.Protected` auth gate, typed params |
| Passkeys | `react-native-passkeys` | iOS 16.4+ ASAuthorization / Android 9+ Credential Manager |
| Wallet SDK | `@rayos/wallet-sdk` (file: dep) | Same SDK as web; `PasskeyProvider` interface injected natively |
| Server state | `@tanstack/react-query` v5 | Offline-first, stale-while-revalidate, mutation retries |
| Auth state | `zustand` + `expo-secure-store` | Persisted session, no key material (passkeys stay in enclave) |
| Secure storage | `expo-secure-store` | `StorageAdapter` for SDK + auth session persistence |
| Animation | `react-native-reanimated` v4 | Smooth gesture-driven sheets and transitions |
| Crypto | `expo-crypto` | Cryptographically random salt bytes for wallet deployment |
| Unit tests | Jest (`jest-expo`) + Testing Library | Component + hook coverage, both color schemes |
| E2E tests | Maestro | Onboarding, login, send flow — device/simulator |
| CI/CD | GitHub Actions + EAS | `eas build`, `eas update`, `eas submit` per profile |

---

## 3. Directory Structure

```
mobile-app/
├── app/                              # expo-router file-based routes
│   ├── _layout.tsx                   # QueryClient, splash, deep-link handler, Stack.Protected auth gate
│   ├── +not-found.tsx                # 404 fallback
│   ├── (onboarding)/                 # Unauthenticated group (no tab bar)
│   │   ├── _layout.tsx               # Stack navigator
│   │   ├── index.tsx                 # Welcome / landing
│   │   ├── create.tsx                # Passkey registration → wallet deployment
│   │   ├── login.tsx                 # Passkey assertion → wallet lookup
│   │   └── recover.tsx               # Initiate guardian recovery
│   ├── (dashboard)/                  # Authenticated group (custom tab bar)
│   │   ├── _layout.tsx               # Tab navigator with ThemeSwitch
│   │   ├── wallet.tsx                # Balance · send · receive · activity · signers
│   │   ├── policies.tsx              # Spend limit · session keys · allow-list
│   │   ├── guardians.tsx             # Guardians · threshold · active recovery
│   │   └── settings.tsx             # Theme · app info · sign out
│   └── recovery/
│       └── [proposalId].tsx          # Guardian approval deep-link target
│
├── components/
│   ├── ui/                           # Design system primitives
│   │   ├── AuroraBackground.tsx      # Brand gradient surface
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Screen.tsx
│   │   ├── Sheet.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── TabBar.tsx                # Custom animated bottom tab bar
│   │   ├── ThemeSwitch.tsx
│   │   ├── OnboardingHeader.tsx
│   │   └── StepDots.tsx
│   ├── wallet/                       # BalanceCard, TransactionList, SendSheet, SignerList
│   ├── policies/                     # SpendLimitCard, SessionKeysCard, AllowListCard
│   └── guardians/                    # GuardianList, RecoveryBanner, RecoveryStatusCard
│
├── native/
│   └── passkey-adapter.ts            # ← ONLY platform-specific seam
│                                     #   Implements PasskeyProvider from @rayos/wallet-sdk
│                                     #   using react-native-passkeys
│
├── hooks/
│   ├── useTheme.tsx                  # Color-scheme resolution + SecureStore override
│   ├── useWallet.ts                  # Balance, signers, send mutation
│   ├── usePolicies.ts                # Session keys CRUD
│   └── useRecovery.ts                # Recovery proposal lifecycle
│
├── lib/
│   ├── config.ts                     # Zod-validated EXPO_PUBLIC_* env vars
│   ├── sdk-client.ts                 # WalletSdk singleton (native passkey provider injected)
│   ├── storage-adapter.ts            # StorageAdapter → expo-secure-store
│   ├── query-client.ts               # TanStack Query client (offline-first defaults)
│   ├── api.ts                        # Typed fetch wrapper for relay-backend endpoints
│   ├── webauthn.ts                   # Challenge fetch + assertion verify helpers
│   ├── format.ts                     # XLM formatting, address truncation, date helpers
│   └── theme.ts                      # Design tokens (mirrored from web-dashboard CSS vars)
│
├── store/
│   └── auth.ts                       # Zustand store (walletAddress + credentialId, SecureStore-persisted)
│
├── assets/                           # icon.png, adaptive-icon.png, splash-icon.png, logo.png — light & dark
├── e2e/flows/                        # Maestro YAML test flows
│   ├── onboarding.yml
│   └── send.yml
│
├── docs/                             # ← You are here
│   ├── ARCHITECTURE.md
│   ├── SETUP.md
│   ├── CONTRIBUTING.md
│   └── SECURITY.md
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Typecheck · lint · prettier · test · expo-doctor · export
│   │   ├── eas-preview.yml           # Per-PR internal build with QR code comment
│   │   ├── eas-release.yml           # Tag → build → manual approval gate → store submit
│   │   └── eas-update.yml            # OTA to preview/production channels
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.yml
│   │   └── feature_request.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── app.config.ts                     # Expo config (env-driven, no secrets)
├── eas.json                          # development / preview / production profiles
├── .env.example                      # All EXPO_PUBLIC_* vars — copy to .env to start
└── package.json
```

---

## 4. Key Design Decisions

### 4.1 — `PasskeyProvider` Interface (the only platform seam)

`@rayos/wallet-sdk` defines a `PasskeyProvider` interface:
```typescript
interface PasskeyProvider {
  createCredential(options: PasskeyRegistrationOptions): Promise<PasskeyCredential>;
  signTransaction(xdr: string, options: PasskeySignOptions): Promise<PasskeyAssertion>;
}
```
The web build uses `@simplewebauthn/browser` (default, no config needed). The mobile app passes `native/passkey-adapter.ts` into the `WalletSdk` constructor via `passkeyProvider`:
```typescript
export const walletSdk = new WalletSdk({
  ...config,
  storage: secureStorageAdapter,
  passkeyProvider: { createCredential, signTransaction }, // ← native impl
});
```
Everything above this seam (hooks, screens, components) is platform-agnostic.

### 4.2 — Associated Domains (passkeys on real devices)

Passkeys silently fail without domain verification:

| Platform | File served by relay-backend | Config in app |
|---|---|---|
| iOS | `/.well-known/apple-app-site-association` | `associatedDomains` in `app.config.ts` |
| Android | `/.well-known/assetlinks.json` | `intentFilters.autoVerify` in `app.config.ts` |

The `TEAMID` and `SHA-256 fingerprint` placeholders in `WellKnownController` must be replaced before real-device testing. See [SETUP.md](SETUP.md#passkeys-on-real-devices).

### 4.3 — Theming

`hooks/useTheme.tsx` reads `useColorScheme()` and allows the user to override with System / Light / Dark in Settings. The override is persisted to `expo-secure-store` and applied to `Appearance.setColorScheme` so native OS controls (alerts, keyboard, status bar) also follow. Tokens in `lib/theme.ts` are kept in sync with `web-dashboard/app/globals.css`.

### 4.4 — Deep Linking

Guardian approval links take the form `rayos://recovery/<proposalId>` (custom scheme) or `https://<PASSKEY_DOMAIN>/recovery/<proposalId>` (universal link). The root `_layout.tsx` intercepts both via `expo-linking`, extracts the `proposalId`, and navigates to `app/recovery/[proposalId].tsx`. This works even when the user is signed out — the screen prompts biometric login before displaying the approval UI.

---

## 5. Key Flows

### Registration (new wallet)
```
User enters name
  → POST /api/webauthn/register/options   (relay-backend)
  → native createCredential()             (Face ID / biometric)
  → POST /api/webauthn/register/verify    (relay-backend)
  → walletSdk.createWallet()              (deploy contract on Stellar testnet)
  → store walletAddress + credentialId   (expo-secure-store, via Zustand)
  → navigate to (dashboard)/wallet
```

### Sign In (returning user)
```
  → POST /api/webauthn/assert/options     (relay-backend)
  → native signTransaction()              (Face ID / biometric)
  → GET  /api/wallets/:credentialId       (relay-backend)
  → store walletAddress + credentialId
  → navigate to (dashboard)/wallet
```

### Send Transaction
```
Build XDR locally (via SDK)
  → walletSdk.signAndSubmit(xdr, opts)    (triggers biometric)
  → POST /api/relay/submit                (relay-backend → Launchtube)
  → poll GET /api/relay/status/:txHash
```

### Guardian Recovery
```
Guardian receives email (Resend) with deep link
  → opens rayos://recovery/<proposalId>  or https://<domain>/recovery/<id>
  → biometric login
  → POST /api/recovery/approve
  → auto-poll /api/recovery/:id/status every 10 s
  → on 2/2 approvals + 48 h timelock: execute_recovery on-chain
```

---

## 6. Testing Strategy

| Layer | Tool | What's covered |
|---|---|---|
| Unit | Jest (`jest-expo`) | `lib/format`, `lib/api`, `lib/theme`, `native/passkey-adapter` mapping, `store/auth`, component rendering in light + dark |
| Integration | Testing Library | Hook behaviour with mocked QueryClient and SDK |
| E2E | Maestro | `onboarding.yml` (create wallet), `send.yml` (send flow to biometric gate) |
| Manual | Real devices | Biometric ceremonies, passkey create + assert, deep-link activation from email |

Run all automated tests:
```bash
pnpm test           # jest
pnpm e2e            # maestro test e2e/flows (needs device or simulator running)
```

---

## 7. CI/CD Pipelines

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | Every PR + push to `main` | typecheck → lint → prettier → jest → expo-doctor → `expo export` |
| `eas-preview.yml` | Every PR + push to `main` | `eas build --profile preview --platform all` · posts QR code comment on PR |
| `eas-release.yml` | Push tag `v*.*.*` | quality gates → `eas build --profile production` → ⏸ **manual approval** → `eas submit` |
| `eas-update.yml` | Push to `main` or manual dispatch | `eas update` OTA to `preview` (auto) or `production` (manual) |

---

## 8. Dependencies on Other Repos

| Repo | Nature of dependency |
|---|---|
| [`wallet-sdk`](https://github.com/Rayos-Org/wallet-sdk) | Vendored tarball (`vendor/`, see docs/SETUP.md) — `PasskeyProvider`, `WalletSdk`, all types |
| [`relay-backend`](https://github.com/Rayos-Org/relay-backend) | All API calls: WebAuthn, relay, sessions, recovery, well-known files |
| [`wallet-contracts`](https://github.com/Rayos-Org/wallet-contracts) | Indirect — JS bindings consumed via `wallet-sdk` |
| [`infra`](https://github.com/Rayos-Org/infra) | EAS build workflow reused; environment variable naming convention |
| [`web-dashboard`](https://github.com/Rayos-Org/web-dashboard) | Design token parity; conceptual API contract mirror |
