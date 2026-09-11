import { api, ApiError, errorMessage, horizon } from "@/lib/api";

const RELAY = process.env.EXPO_PUBLIC_RELAY_BACKEND_URL!;

function mockFetch(status: number, body: unknown, ok = status < 400) {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  global.fetch = jest.fn(async () => ({
    ok,
    status,
    text: async () => text,
    json: async () => JSON.parse(text),
  })) as any;
  return global.fetch as jest.Mock;
}

describe("api()", () => {
  it("GETs JSON from the relay base URL", async () => {
    const f = mockFetch(200, { walletAddress: "G…" });
    const res = await api<{ walletAddress: string }>("/wallets/abc");
    expect(res.walletAddress).toBe("G…");
    expect(f).toHaveBeenCalledWith(
      `${RELAY}/wallets/abc`,
      expect.objectContaining({ method: "GET" })
    );
  });

  it("POSTs JSON bodies with content-type", async () => {
    const f = mockFetch(201, { ok: true });
    await api("/sessions", { method: "POST", body: { a: 1 } });
    const [, init] = f.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("normalises NestJS error payloads into ApiError", async () => {
    mockFetch(400, { statusCode: 400, message: ["walletAddress must be 56 chars"] });
    await expect(api("/recovery/propose", { method: "POST", body: {} })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "walletAddress must be 56 chars",
    });
  });

  it("surfaces 404 as ApiError with status", async () => {
    mockFetch(404, { message: "No wallet found" });
    const err: unknown = await api("/wallets/nope").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(404);
  });

  it("wraps network failures", async () => {
    global.fetch = jest.fn(async () => {
      throw new Error("Network request failed");
    }) as any;
    await expect(api("/x")).rejects.toMatchObject({ status: 0, message: "Network request failed" });
  });
});

describe("horizon()", () => {
  it("throws ApiError with status on non-2xx", async () => {
    mockFetch(404, {});
    await expect(horizon("/accounts/G")).rejects.toMatchObject({ status: 404 });
  });
});

describe("errorMessage()", () => {
  it("prefers ApiError / Error messages and falls back", () => {
    expect(errorMessage(new ApiError("boom", 500))).toBe("boom");
    expect(errorMessage(new Error("bad"))).toBe("bad");
    expect(errorMessage("x", "fallback")).toBe("fallback");
  });
});
