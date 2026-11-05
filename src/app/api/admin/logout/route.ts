import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_COOKIE, adminCookieOptions, revokeToken } from "@/lib/admin";
import { NO_STORE } from "@/lib/http";

export async function POST(request: NextRequest) {
  await revokeToken(request.cookies.get(ADMIN_COOKIE)?.value);
  const response = NextResponse.json({ ok: true }, { headers: NO_STORE });
  response.cookies.set(ADMIN_COOKIE, "", { ...adminCookieOptions, maxAge: 0 });
  return response;
}
