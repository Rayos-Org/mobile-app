# Contributing to Rayos Mobile App

Thank you for your interest in contributing! This document explains how to get involved, our development workflow, and the standards we hold contributions to.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Workflow](#development-workflow)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Getting Help](#getting-help)

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/). By participating, you agree to uphold a welcoming and respectful environment for everyone.

---

## How to Contribute

### Reporting Bugs

Use the **Bug Report** issue template. Include:
- Device model and OS version
- Expo / React Native version (`pnpm expo --version`)
- Steps to reproduce (be specific about biometric/passkey steps)
- Expected vs. actual behaviour
- Relevant logs from Metro or `adb logcat` / Xcode console

### Suggesting Features

Use the **Feature Request** issue template. Describe:
- The user problem you're solving
- Your proposed solution
- Alternatives you've considered
- Whether this affects native code (requires `eas build`) or JS only (OTA-able)

### First-Time Contributors

Look for issues labelled **`good first issue`** or **`help wanted`**. These are intentionally scoped to be approachable without deep context on the wallet protocol.

---

## Development Workflow

1. **Fork** the repo and clone your fork.
2. Set up the project following [SETUP.md](SETUP.md).
3. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-feature
   ```
4. Make your changes (see [Code Standards](#code-standards)).
5. Run all quality checks locally:
   ```bash
   pnpm typecheck && pnpm lint && pnpm format:check && pnpm test
   ```
6. Push and open a PR against `main`.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructure, no behaviour change |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build process, tooling, CI |

### Examples

```
feat(passkey): add biometric fallback prompt copy
fix(wallet): correct XLM decimal formatting for amounts < 1
docs(setup): clarify Android assetlinks fingerprint steps
test(useRecovery): add polling interval test for pending status
chore(ci): add expo-doctor check to CI pipeline
```

---

## Pull Request Process

1. **Title** — follow commit convention (e.g. `feat(guardians): add threshold configuration UI`).
2. **Description** — fill in the PR template: what changed, why, how to test.
3. **Link issues** — use `Closes #123` in the description.
4. **CI must pass** — all checks in `ci.yml` must be green before review.
5. **One approval required** — from a maintainer.
6. **No force-push to `main`** — rebase your branch if there are conflicts.

### PR Template Checklist

The PR template will ask you to confirm:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes with no regressions
- [ ] New code has tests where appropriate
- [ ] Passkey / native changes tested on a real device (not just simulator)
- [ ] Documentation updated if behaviour changed

---

## Code Standards

### TypeScript

- **Strict mode** — no `any`, no `@ts-ignore` without an explanatory comment.
- Prefer explicit return types on public functions and hooks.
- Use `zod` for all external data validation (API responses, env vars).

### React Native / Expo

- All screens in `app/` are thin — business logic lives in `hooks/` and `lib/`.
- Use `StyleSheet.create()` — not inline style objects — for performance.
- Never store key material in AsyncStorage or plain variables — use `expo-secure-store`.
- Biometric prompts **must** include clear, human-readable `title` and `description` explaining what is being signed.

### Naming

| Item | Convention |
|---|---|
| Files | `camelCase.ts` / `PascalCase.tsx` for components |
| Components | `PascalCase` |
| Hooks | `use` prefix, camelCase |
| Constants | `UPPER_SNAKE_CASE` |
| Types / Interfaces | `PascalCase` |

### Imports

Absolute imports are preferred over relative for anything more than one level deep. The `tsconfig.json` path aliases map `@/` to the root.

---

## Testing Requirements

| Change type | Required tests |
|---|---|
| New hook | Unit test in `__tests__/hooks/` |
| New component | Render test in `__tests__/components/` covering both light and dark theme |
| New `lib/` utility | Unit test in `__tests__/lib/` |
| New screen | Covered by existing hook / component tests is acceptable; add Maestro flow for critical paths |
| Passkey adapter change | `__tests__/lib/passkey-adapter.test.ts` must cover the new mapping |
| Bug fix | Regression test demonstrating the bug is fixed |

Run tests: `pnpm test` (or `pnpm test:ci` for coverage report).

---

## Getting Help

- **GitHub Discussions** — architecture questions, design proposals.
- **Issues** — bugs and feature requests with the relevant template.
- **Inline code comments** — PRs are the best place for implementation feedback.

We aim to respond to new issues and PRs within **5 business days**.
