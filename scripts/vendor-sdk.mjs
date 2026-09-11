// Re-vendor @rayos/wallet-sdk from the sibling checkout (../wallet-sdk).
//
// Why a tarball: EAS Build and GitHub Actions only see this repository, so a
// `file:../wallet-sdk` link cannot resolve there. Until the SDK version that
// exposes `PasskeyProvider` is published to npm, we ship the packed build in
// vendor/ and pin package.json to it. Run this after pulling SDK changes:
//
//   pnpm sdk:vendor && pnpm install
import { execSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const sdk = resolve(root, "..", "wallet-sdk");
const vendor = join(root, "vendor");

if (!existsSync(join(sdk, "package.json"))) {
  console.error(`wallet-sdk not found at ${sdk}. Clone Rayos-Org/wallet-sdk next to this repo.`);
  process.exit(1);
}

execSync("pnpm install --frozen-lockfile", { cwd: sdk, stdio: "inherit" });
execSync("pnpm run build", { cwd: sdk, stdio: "inherit" });

mkdirSync(vendor, { recursive: true });
for (const f of readdirSync(vendor)) if (f.endsWith(".tgz")) unlinkSync(join(vendor, f));
execSync(`pnpm pack --pack-destination "${vendor}"`, { cwd: sdk, stdio: "inherit" });

const tgz = readdirSync(vendor).find((f) => f.endsWith(".tgz"));
const pkgPath = join(root, "package.json");
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
pkg.dependencies["@rayos/wallet-sdk"] = `file:vendor/${tgz}`;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
console.log(`\nVendored ${tgz}. Now run: pnpm install`);
