import { NextResponse, type NextRequest } from "next/server";

import { loadRates, ratesToArray } from "@/lib/delivery-rates";
import { clientIp, NO_STORE } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public, read-only delivery prices so the checkout summary matches what the
 * server will charge. No secrets, no customer data.
 */
export async function GET(request: NextRequest) {
  const limited = await rateLimit(`delivery-rates:${clientIp(request)}`, {
    limit: 60,
    windowMs: 60 * 1000,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const table = await loadRates();
  return NextResponse.json({ rates: ratesToArray(table) }, { headers: NO_STORE });
}
