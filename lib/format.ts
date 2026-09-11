/** Stroops → XLM string with up to 7 decimals, trimmed. */
export function formatXLM(stroops?: bigint | number | string | null, maxDecimals = 4): string {
  if (stroops === null || stroops === undefined) return "0";
  const n = typeof stroops === "bigint" ? stroops : BigInt(Math.trunc(Number(stroops)));
  const negative = n < 0n;
  const abs = negative ? -n : n;
  const whole = abs / 10_000_000n;
  const frac = (abs % 10_000_000n).toString().padStart(7, "0").slice(0, maxDecimals).replace(/0+$/, "");
  const wholeStr = whole.toLocaleString("en-US");
  return `${negative ? "-" : ""}${wholeStr}${frac ? "." + frac : ""}`;
}

/** Horizon amounts are decimal strings ("12.5000000"). */
export function formatAmount(amount?: string | null, maxDecimals = 4): string {
  if (!amount) return "0";
  const num = Number(amount);
  if (Number.isNaN(num)) return amount;
  return num.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}

export function shortAddress(address?: string | null, head = 6, tail = 4): string {
  if (!address) return "";
  if (address.length <= head + tail + 1) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function isStellarAddress(value: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(value.trim());
}

export function isContractAddress(value: string): boolean {
  return /^C[A-Z2-7]{55}$/.test(value.trim());
}

/** XLM decimal string → stroops bigint (for contract calls). */
export function toStroops(xlm: string): bigint {
  const [whole = "0", frac = ""] = xlm.trim().split(".");
  const fracPadded = (frac + "0000000").slice(0, 7);
  return BigInt(whole) * 10_000_000n + BigInt(fracPadded || "0");
}

export function bytesToHex(bytes: Uint8Array | number[]): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
