import { NextResponse, type NextRequest } from "next/server";

import {
  ADMIN_COOKIE,
  adminConfigured,
  adminCookieOptions,
  checkPassword,
  createToken,
} from "@/lib/admin";
import { clientIp, jsonError, logServerError, NO_STORE, readJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  if (!adminConfigured()) {
    return jsonError("not_configured", 503);
  }

  const ip = clientIp(request);
  const limited = await rateLimit(`admin:login:${ip}`, {
    limit: MAX_ATTEMPTS,
    windowMs: WINDOW_MS,
  });
  if (!limited.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": String(limited.retryAfter) } },
    );
  }

  const body = await readJson(request, 4 * 1024);
  if (!body.ok) return body.response;

  const password = (body.value as { password?: unknown } | null)?.password;
  if (!checkPassword(password)) {
    return jsonError("invalid", 401);
  }

  try {
    const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
    response.cookies.set(ADMIN_COOKIE, createToken(), adminCookieOptions);
    return response;
  } catch (error) {
    logServerError("admin:login", error);
    return jsonError("server", 500);
  }
}
