import { NextResponse, type NextRequest } from "next/server";

import { clientIp, jsonError, logServerError, NO_STORE } from "@/lib/http";
import { findOrder, publicOrder, StorageUnavailableError } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const ip = clientIp(request);

  // Two buckets: one per client, one per client+order to stop enumeration.
  const perClient = await rateLimit(`track:ip:${ip}`, { limit: 30, windowMs: 10 * 60 * 1000 });
  if (!perClient.ok) {
    return jsonError("rate_limited", 429, { retryAfter: perClient.retryAfter });
  }

  const { number } = await params;
  const wanted = String(number ?? "").trim().toUpperCase();
  const perOrder = await rateLimit(`track:order:${ip}:${wanted}`, {
    limit: 10,
    windowMs: 10 * 60 * 1000,
  });
  if (!perOrder.ok) {
    return jsonError("rate_limited", 429, { retryAfter: perOrder.retryAfter });
  }

  const phone = request.nextUrl.searchParams.get("phone") ?? "";

  try {
    const order = await findOrder(wanted, phone);
    // Same response whether the order is missing or the phone is wrong.
    if (!order) return jsonError("not_found", 404);
    return NextResponse.json(
      { order: publicOrder(order) },
      { headers: { ...NO_STORE, "Referrer-Policy": "no-referrer" } },
    );
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      logServerError("orders:storage", error);
      return jsonError("storage_unavailable", 503);
    }
    logServerError("orders:track", error);
    return jsonError("server", 500);
  }
}
