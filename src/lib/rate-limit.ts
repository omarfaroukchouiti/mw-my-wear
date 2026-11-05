import { createHash } from "node:crypto";

/**
 * Rate limiting.
 *
 * Uses Upstash Redis over its REST API when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are configured (works across serverless instances),
 * and falls back to a per-process in-memory window otherwise.
 *
 * Keys are hashed before they leave the process so IP addresses and phone
 * numbers never end up in the Redis keyspace.
 */

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  /** Seconds until the current window resets. */
  retryAfter: number;
  driver: "upstash" | "memory";
};

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

function redisConfig(): { url: string; token: string } | null {
  const url = (process.env.UPSTASH_REDIS_REST_URL ?? "").replace(/\/+$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  if (!url.startsWith("https://") || token.length < 10) return null;
  return { url, token };
}

export function rateLimitDriver(): "upstash" | "memory" {
  return redisConfig() ? "upstash" : "memory";
}

function hashed(key: string): string {
  return createHash("sha256").update(key).digest("hex").slice(0, 32);
}

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size > MAX_BUCKETS) buckets.clear();
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: Math.ceil(windowMs / 1000), driver: "memory" };
  }
  bucket.count += 1;
  return {
    ok: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    driver: "memory",
  };
}

let warned = false;

async function redisLimit(
  config: { url: string; token: string },
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult | null> {
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["SET", key, "0", "PX", String(windowMs), "NX"],
        ["INCR", key],
        ["PTTL", key],
      ]),
      // Never let a slow limiter hold a request hostage.
      signal: AbortSignal.timeout(2000),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`upstash_${response.status}`);
    const body = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(body?.[1]?.result);
    const ttl = Number(body?.[2]?.result);
    if (!Number.isFinite(count)) throw new Error("upstash_shape");
    const retryAfter = Number.isFinite(ttl) && ttl > 0 ? Math.ceil(ttl / 1000) : Math.ceil(windowMs / 1000);
    return {
      ok: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfter,
      driver: "upstash",
    };
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn("[rate-limit] Redis unavailable, falling back to memory:", (error as Error).message);
    }
    return null;
  }
}

export async function rateLimit(
  key: string,
  options: { limit: number; windowMs: number },
): Promise<RateLimitResult> {
  const limit = Math.max(1, Math.floor(options.limit));
  const windowMs = Math.max(1000, Math.floor(options.windowMs));
  const hashedKey = `mw:rl:${hashed(key)}`;
  const config = redisConfig();
  if (config) {
    const result = await redisLimit(config, hashedKey, limit, windowMs);
    if (result) return result;
  }
  return memoryLimit(hashedKey, limit, windowMs);
}
