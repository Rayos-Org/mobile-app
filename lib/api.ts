import { config } from "./config";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PATCH";
  body?: unknown;
  /** Abort after this many ms (default 20s — Render cold starts are slow). */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * Thin fetch wrapper for the relay-backend. Adds JSON encoding, timeouts,
 * and normalises NestJS error payloads into `ApiError`.
 */
export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, timeoutMs = 20_000, headers = {} } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.RELAY_BACKEND_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await res.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      let msg = `Request failed (${res.status})`;
      if (data && typeof data === "object" && "message" in data) {
        const m = (data as { message: unknown }).message;
        msg = Array.isArray(m) ? m.join(", ") : String(m);
      }
      throw new ApiError(msg, res.status, data);
    }
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if ((err as Error).name === "AbortError") {
      throw new ApiError(
        "The relay took too long to respond. Check your connection and try again.",
        0
      );
    }
    throw new ApiError((err as Error).message || "Network error", 0);
  } finally {
    clearTimeout(timer);
  }
}

/** Horizon (public Stellar API) — separate base URL, same error handling. */
export async function horizon<T = unknown>(path: string, timeoutMs = 15_000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${config.HORIZON_URL}${path}`, { signal: controller.signal });
    if (!res.ok) throw new ApiError(`Horizon ${res.status}`, res.status);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

export function errorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message || fallback;
  return fallback;
}
