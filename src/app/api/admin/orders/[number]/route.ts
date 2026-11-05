import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, adminNoStoreHeaders, verifyToken } from "@/lib/admin";
import { clientIp, jsonError, logServerError, readJson } from "@/lib/http";
import {
  getOrder,
  ORDER_STATUSES,
  StorageUnavailableError,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

function unauthorized() {
  return jsonError("unauthorized", 401);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  if (!(await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value))) return unauthorized();

  const { number } = await params;
  try {
    const order = await getOrder(number);
    if (!order) return jsonError("not_found", 404);
    return NextResponse.json({ order }, { headers: adminNoStoreHeaders });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      logServerError("admin:storage", error);
      return jsonError("storage_unavailable", 503);
    }
    logServerError("admin:order", error);
    return jsonError("server", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  if (!(await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value))) return unauthorized();

  const limited = await rateLimit(`admin:patch:${clientIp(request)}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...adminNoStoreHeaders, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const { number } = await params;
  const body = await readJson(request, 2 * 1024);
  if (!body.ok) return body.response;

  const status = (body.value as { status?: OrderStatus } | null)?.status;
  if (!status || !ORDER_STATUSES.includes(status)) {
    return jsonError("status", 400);
  }

  try {
    const result = await updateOrderStatus(number, status);
    if (result.ok) {
      return NextResponse.json({ ok: true }, { headers: adminNoStoreHeaders });
    }
    if (result.reason === "not_found") return jsonError("not_found", 404);
    // 409 tells the dashboard which moves are legal right now.
    return jsonError("invalid_transition", 409, {
      current: result.current,
      allowed: result.allowed,
    });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      logServerError("admin:storage", error);
      return jsonError("storage_unavailable", 503);
    }
    logServerError("admin:status", error);
    return jsonError("server", 500);
  }
}
