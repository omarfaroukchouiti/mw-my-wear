import { NextResponse, type NextRequest } from "next/server";

import { clientIp, jsonError, logServerError, NO_STORE, readJson } from "@/lib/http";
import { feeFrom, loadRates } from "@/lib/delivery-rates";
import {
  findOrder,
  publicOrder,
  saveOrder,
  StorageUnavailableError,
  validateOrder,
} from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

/** A full cart with print designs is a few megabytes; refuse anything bigger. */
const MAX_BODY_BYTES = 8 * 1024 * 1024;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ORDERS = 8;

/**
 * In-process replay cache. The database (migration 003) is the source of truth
 * once installed; this map keeps a double submit idempotent even before the
 * migration is applied, or on the local file fallback.
 */
const recentKeys = new Map<string, { number: string; phone: string; expiresAt: number }>();
const MAX_KEYS = 5_000;

function pruneKeys(now: number): void {
  if (recentKeys.size < MAX_KEYS) return;
  for (const [key, entry] of recentKeys) {
    if (entry.expiresAt <= now) recentKeys.delete(key);
  }
  if (recentKeys.size >= MAX_KEYS) recentKeys.clear();
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);

  const limited = await rateLimit(`orders:create:${ip}`, {
    limit: MAX_ORDERS,
    windowMs: WINDOW_MS,
  });
  if (!limited.ok) {
    return jsonError("rate_limited", 429, { retryAfter: limited.retryAfter });
  }

  const body = await readJson(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  // Fees come from the database (owner-editable), never from the request.
  const rates = await loadRates();
  const checked = validateOrder(body.value, (code, mode) => feeFrom(rates, code, mode));
  if (!checked.ok) {
    return jsonError(checked.reason, 400, { fields: checked.fields });
  }

  // The key is optional: without it the request is a normal one-shot order.
  const rawKey = request.headers.get("idempotency-key") ?? "";
  const key = /^[A-Za-z0-9_-]{16,64}$/.test(rawKey) ? rawKey : null;

  try {
    const now = Date.now();
    if (key) {
      pruneKeys(now);
      const known = recentKeys.get(key);
      if (known && known.expiresAt > now) {
        const replay = await findOrder(known.number, known.phone);
        if (replay) {
          return NextResponse.json(
            { order: publicOrder(replay), replayed: true },
            { status: 200, headers: NO_STORE },
          );
        }
      }
    }

    const saved = await saveOrder(checked.order, key);
    if (key) {
      recentKeys.set(key, {
        number: saved.order.number,
        phone: saved.order.customer.phone,
        expiresAt: now + 24 * 60 * 60 * 1000,
      });
    }
    return NextResponse.json(
      { order: publicOrder(saved.order), replayed: saved.replayed },
      { status: saved.replayed ? 200 : 201, headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      // No Supabase and no explicit ORDERS_FILE in production: refuse the
      // order instead of writing it to a disk that will disappear.
      logServerError("orders:storage", error);
      return jsonError("storage_unavailable", 503);
    }
    logServerError("orders", error);
    return jsonError("server", 500);
  }
}
