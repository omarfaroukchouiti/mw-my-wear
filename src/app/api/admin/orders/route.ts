import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, adminNoStoreHeaders, verifyToken } from "@/lib/admin";
import { clientIp, jsonError, logServerError } from "@/lib/http";
import { listOrders, ORDER_STATUSES, StorageUnavailableError } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  if (!(await verifyToken(request.cookies.get(ADMIN_COOKIE)?.value))) {
    return jsonError("unauthorized", 401);
  }

  const limited = await rateLimit(`admin:list:${clientIp(request)}`, {
    limit: 120,
    windowMs: 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...adminNoStoreHeaders, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const params = request.nextUrl.searchParams;
  const status = params.get("status") ?? undefined;
  if (status && !ORDER_STATUSES.includes(status as never)) {
    return jsonError("status", 400);
  }

  const pageInput = Number(params.get("page") ?? 1);
  const page = Number.isFinite(pageInput) && pageInput > 0 ? Math.floor(pageInput) : 1;

  try {
    const result = await listOrders({
      status,
      query: params.get("q") ?? undefined,
      page,
      perPage: 20,
    });
    return NextResponse.json(result, { headers: adminNoStoreHeaders });
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      logServerError("admin:storage", error);
      return jsonError("storage_unavailable", 503);
    }
    logServerError("admin:list", error);
    return jsonError("server", 500);
  }
}
