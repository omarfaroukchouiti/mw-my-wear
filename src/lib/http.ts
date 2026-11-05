import { NextResponse, type NextRequest } from "next/server";

/**
 * Small HTTP helpers shared by the API routes: client identity, bounded JSON
 * parsing, uniform error shapes and server-side logging that never prints
 * request bodies or environment values.
 */

/** Best-effort client IP. Trusts proxy headers, so only deploy behind a proxy. */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return (
    first ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

export const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "X-Content-Type-Options": "nosniff",
} as const;

type JsonRead =
  | { ok: true; value: unknown }
  | { ok: false; response: NextResponse };

/**
 * Read a JSON body with a hard size ceiling and a content-type check.
 * Prevents multi-megabyte bodies from reaching validation/business logic.
 */
export async function readJson(request: NextRequest, maxBytes: number): Promise<JsonRead> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json({ error: "content_type" }, { status: 415, headers: NO_STORE }),
    };
  }

  const declared = Number(request.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "too_large" }, { status: 413, headers: NO_STORE }),
    };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "body" }, { status: 400, headers: NO_STORE }),
    };
  }

  if (raw.length > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ error: "too_large" }, { status: 413, headers: NO_STORE }),
    };
  }

  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "body" }, { status: 400, headers: NO_STORE }),
    };
  }
}

export function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status, headers: NO_STORE });
}

/** Log a server-side failure without leaking secrets or customer data. */
export function logServerError(tag: string, error: unknown): void {
  if (error instanceof Error) {
    console.error(`[${tag}] ${error.name}: ${error.message}`);
    if (process.env.NODE_ENV !== "production" && error.stack) {
      console.error(error.stack);
    }
    return;
  }
  console.error(`[${tag}] unexpected error`);
}

/** RFC-ish retry hint for 429 responses. */
export function rateLimitHeaders(retryAfter: number): Record<string, string> {
  return { ...NO_STORE, "Retry-After": String(Math.max(1, retryAfter)) };
}
