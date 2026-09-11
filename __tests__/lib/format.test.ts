import {
  bytesToHex,
  formatAmount,
  formatXLM,
  isContractAddress,
  isStellarAddress,
  shortAddress,
  toStroops,
} from "@/lib/format";

describe("formatXLM", () => {
  it("formats stroops to XLM with trimmed decimals", () => {
    expect(formatXLM(12_500_000n)).toBe("1.25");
    expect(formatXLM(10_000_000n)).toBe("1");
    expect(formatXLM(0n)).toBe("0");
    expect(formatXLM(null)).toBe("0");
  });

  it("groups thousands and respects maxDecimals", () => {
    expect(formatXLM(12_405_000_000n)).toBe("1,240.5");
    expect(formatXLM(1_234_567n, 7)).toBe("0.1234567");
    expect(formatXLM(1_234_567n, 2)).toBe("0.12");
  });

  it("handles negatives and numeric input", () => {
    expect(formatXLM(-25_000_000n)).toBe("-2.5");
    expect(formatXLM(30_000_000)).toBe("3");
  });
});

describe("toStroops", () => {
  it("round-trips with formatXLM", () => {
    expect(toStroops("1.25")).toBe(12_500_000n);
    expect(toStroops("100")).toBe(1_000_000_000n);
    expect(formatXLM(toStroops("0.0000001"), 7)).toBe("0.0000001");
  });
});

describe("formatAmount", () => {
  it("formats Horizon decimal strings", () => {
    expect(formatAmount("12.5000000")).toBe("12.5");
    expect(formatAmount("1000.0000000")).toBe("1,000");
    expect(formatAmount(undefined)).toBe("0");
  });
});

describe("address helpers", () => {
  const G = "G" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".repeat(2).slice(0, 55);
  it("validates Stellar account and contract addresses", () => {
    expect(G).toHaveLength(56);
    expect(isStellarAddress(G)).toBe(true);
    expect(isStellarAddress(G.slice(1))).toBe(false);
    expect(isContractAddress("C" + G.slice(1))).toBe(true);
    expect(isContractAddress(G)).toBe(false);
  });

  it("shortens addresses", () => {
    expect(shortAddress(G)).toBe(`${G.slice(0, 6)}…${G.slice(-4)}`);
    expect(shortAddress("abc")).toBe("abc");
    expect(shortAddress(null)).toBe("");
  });
});

describe("bytesToHex", () => {
  it("encodes bytes", () => {
    expect(bytesToHex(new Uint8Array([0, 15, 255]))).toBe("000fff");
  });
});
