import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { isRevoked, revoke } from "./session-store";

/**
 * Admin session: a signed, expiring token in an HttpOnly cookie.
 *
 * One password per deployment is enough for a solo brand, so there is no user
 * table. The token is self-contained:
 *
 *   v2.<base64url(payload)>.<hex signature>
 *
 * payload = { iat, exp, jti, pv }
 *   iat  issued-at (seconds)
 *   exp  expiry (seconds)
 *   jti  random session id, revoked on logout
 *   pv   HMAC(secret, password) prefix — rotating the password kills every
 *        session that was issued with the old one
 *
 * Security properties:
 *  - the signing secret is separate from the password and never leaves the
 *    server (ADMIN_SECRET, minimum 32 characters);
 *  - password and signature comparisons are constant-time;
 *  - the cookie is HttpOnly + SameSite=Strict + Secure in production;
 *  - sessions expire (ADMIN_SESSION_HOURS, default 12h, max 7 days);
 *  - logout revokes the current session id on this instance.
 *
 * Limitation: the revocation list is per-process. With several instances behind
 * a load balancer a revoked token can still be accepted by another instance
 * until it expires. Keep ADMIN_SESSION_HOURS short, or move the revocation set
 * to a shared store (Redis / Supabase) when the site is scaled out.
 */

export const ADMIN_COOKIE = "mw_admin";

const TOKEN_VERSION = "v2";
const MIN_SECRET_LENGTH = 32;
const MIN_PASSWORD_LENGTH = 12;
const DEFAULT_SESSION_HOURS = 12;
const MAX_SESSION_HOURS = 24 * 7;

/** Passwords that shipped in examples or are commonly guessed. */
const BANNED_PASSWORDS = new Set([
  "mw-admin-2026",
  "changeme",
  "password",
  "admin",
  "admin123",
  "123456789012",
  "mywear",
  "mwstore",
]);

export function adminPassword(): string | null {
  const value = process.env.ADMIN_PASSWORD ?? "";
  return value.length >= MIN_PASSWORD_LENGTH ? value : null;
}

export function adminSecret(): string | null {
  const value = process.env.ADMIN_SECRET ?? "";
  return value.length >= MIN_SECRET_LENGTH ? value : null;
}

export function adminConfigured(): boolean {
  return Boolean(adminPassword() && adminSecret());
}

/** Problems with the configured admin password, as i18n-neutral codes. */
export function passwordIssues(): string[] {
  const value = process.env.ADMIN_PASSWORD ?? "";
  const issues: string[] = [];
  if (!value) return ["missing"];
  if (value.length < MIN_PASSWORD_LENGTH) issues.push("short");
  const lower = value.toLowerCase();
  if (BANNED_PASSWORDS.has(lower)) issues.push("default");
  if (/^[a-z]+$/i.test(value) || /^\d+$/.test(value)) issues.push("low-variety");
  if (new Set(value).size < 5) issues.push("low-variety");
  return issues;
}

/** True when the owner should change the password before going live. */
export function weakPassword(): boolean {
  return passwordIssues().length > 0;
}

export function sessionTtlSeconds(): number {
  const raw = Number(process.env.ADMIN_SESSION_HOURS ?? DEFAULT_SESSION_HOURS);
  const hours = Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_SESSION_HOURS) : DEFAULT_SESSION_HOURS;
  return Math.round(hours * 60 * 60);
}

/* ------------------------------------------------------------------ */
/* Password                                                            */
/* ------------------------------------------------------------------ */

function digest(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export function checkPassword(candidate: unknown): boolean {
  const expected = adminPassword();
  if (!expected) return false;
  const given = typeof candidate === "string" ? candidate : "";
  if (!given || given.length > 512) return false;
  // Hash both sides so the comparison is constant-time and length-independent.
  return timingSafeEqual(digest(given), digest(expected));
}

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

function secret(): string | null {
  return adminSecret();
}

/** Password fingerprint: lets a password change invalidate all sessions. */
function passwordVersion(secretValue: string): string {
  return createHmac("sha256", secretValue).update("mw-admin-password").update(adminPassword() ?? "").digest("hex").slice(0, 16);
}

function sign(payload: string, secretValue: string): string {
  return createHmac("sha256", secretValue).update(`${TOKEN_VERSION}.${payload}`).digest("hex");
}

type SessionPayload = {
  iat: number;
  exp: number;
  jti: string;
  pv: string;
};

function readPayload(encoded: string): SessionPayload | null {
  try {
    const value = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as SessionPayload;
    if (
      value &&
      typeof value.exp === "number" &&
      typeof value.iat === "number" &&
      typeof value.jti === "string" &&
      typeof value.pv === "string"
    ) {
      return value;
    }
  } catch {
    // fall through
  }
  return null;
}

export function createToken(): string {
  const signingSecret = secret();
  if (!signingSecret || !adminPassword()) {
    throw new Error("admin_not_configured");
  }
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    iat: now,
    exp: now + sessionTtlSeconds(),
    jti: randomBytes(18).toString("base64url"),
    pv: passwordVersion(signingSecret),
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${TOKEN_VERSION}.${encoded}.${sign(encoded, signingSecret)}`;
}

export async function verifyToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const signingSecret = secret();
  const password = adminPassword();
  if (!signingSecret || !password) return false;
  if (token.length > 512) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [version, encoded, signature] = parts;
  if (version !== TOKEN_VERSION || !encoded || !signature) return false;

  const expected = sign(encoded, signingSecret);
  if (signature.length !== expected.length) return false;
  let signatureOk = false;
  try {
    signatureOk = timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
  if (!signatureOk) return false;

  const payload = readPayload(encoded);
  if (!payload) return false;

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) return false;
  if (payload.iat > now + 120) return false;
  if (payload.jti.length < 10) return false;
  if (payload.pv !== passwordVersion(signingSecret)) return false;

  if (await isRevoked(payload.jti, now)) return false;
  return true;
}

/** Called by logout: the token stops working immediately across instances. */
export async function revokeToken(token: string | undefined | null): Promise<void> {
  if (!token) return;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_VERSION) return;
  const payload = readPayload(parts[1]);
  if (!payload) return;
  await revoke(payload.jti, payload.exp);
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  path: "/",
  secure: process.env.NODE_ENV === "production",
  maxAge: sessionTtlSeconds(),
};

/** Headers every private admin response should carry. */
export const adminNoStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  "X-Content-Type-Options": "nosniff",
};
