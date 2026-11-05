import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, adminNoStoreHeaders, verifyToken } from "@/lib/admin";
import {
  loadRates,
  normalizeRate,
  RatesUnavailableError,
  ratesToArray,
  saveRates,
  type DeliveryRate,
} from "@/lib/delivery-rates";
import { clientIp, jsonError, logServerError, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 32 * 1024;

async function authorized(request: NextRequest): Promise<boolean> {
  return verifyToken(request.cookies.get(ADMIN_COOKIE)?.value);
}

export async function GET(request: NextRequest) {
  if (!(await authorized(request))) return jsonError("unauthorized", 401);

  try {
    const rates = ratesToArray(await loadRates());
    return NextResponse.json({ rates }, { headers: adminNoStoreHeaders });
  } catch (error) {
    logServerError("admin:delivery-rates", error);
    return jsonError("server", 500);
  }
}

export async function PUT(request: NextRequest) {
  if (!(await authorized(request))) return jsonError("unauthorized", 401);

  const limited = await rateLimit(`admin:delivery-rates:${clientIp(request)}`, {
    limit: 30,
    windowMs: 10 * 60 * 1000,
  });
  if (!limited.ok) return jsonError("rate_limited", 429, { retryAfter: limited.retryAfter });

  const body = await readJson(request, MAX_BODY_BYTES);
  if (!body.ok) return body.response;

  const raw = (body.value as { rates?: unknown } | null)?.rates;
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 69) {
    return jsonError("validation", 400, { fields: ["rates"] });
  }

  const entries: DeliveryRate[] = [];
  for (const item of raw) {
    const rate = normalizeRate(item);
    if (!rate) return jsonError("validation", 400, { fields: ["rates"] });
    entries.push(rate);
  }

  try {
    const rates = ratesToArray(await saveRates(entries));
    return NextResponse.json({ ok: true, rates }, { headers: adminNoStoreHeaders });
  } catch (error) {
    if (error instanceof RatesUnavailableError) {
      logServerError("admin:delivery-rates:storage", error);
      return jsonError("storage_unavailable", 503);
    }
    logServerError("admin:delivery-rates:save", error);
    return jsonError("server", 500);
  }
}
