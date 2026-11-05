import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared store for revoked admin sessions.
 *
 * A stateless cookie alone cannot be invalidated on logout. Next.js compiles
 * route handlers and pages into separate bundles, so a plain module-level Map
 * is not even shared inside one server process. This module keeps the
 * revocation list in Supabase when it is configured (shared by every instance
 * and bundle), and falls back to a `globalThis` map for local development.
 *
 * If the `admin_revoked_sessions` table is missing, checks fail open (the token
 * stays valid until it expires) and a single warning is logged. Run
 * supabase/migrations/002_admin_sessions.sql to enable real revocation.
 */

const GLOBAL_KEY = Symbol.for("mw.revokedSessions");

type GlobalWithStore = typeof globalThis & {
  [GLOBAL_KEY]?: Map<string, number>;
};

function memory(): Map<string, number> {
  const scope = globalThis as GlobalWithStore;
  scope[GLOBAL_KEY] ??= new Map<string, number>();
  return scope[GLOBAL_KEY];
}

let client: SupabaseClient | null = null;
let tableMissing = false;
let warned = false;

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

function warnOnce(message: string): void {
  if (warned) return;
  warned = true;
  console.warn(`[admin-sessions] ${message}`);
}

export async function isRevoked(jti: string, nowSeconds: number): Promise<boolean> {
  const local = memory();
  const localExpiry = local.get(jti);
  if (localExpiry && localExpiry > nowSeconds) return true;

  const sb = supabase();
  if (!sb || tableMissing) return false;

  try {
    const { data, error } = await sb
      .from("admin_revoked_sessions")
      .select("jti")
      .eq("jti", jti)
      .gt("expires_at", new Date(nowSeconds * 1000).toISOString())
      .maybeSingle();
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        tableMissing = true;
        warnOnce("table admin_revoked_sessions is missing; logout is local-only until the migration runs");
      } else {
        warnOnce(`could not read revocations: ${error.message}`);
      }
      return false;
    }
    return Boolean(data);
  } catch {
    return false;
  }
}

export async function revoke(jti: string, expiresAtSeconds: number): Promise<void> {
  const local = memory();
  if (local.size > 5000) {
    for (const [key, expiry] of local) if (expiry <= Date.now() / 1000) local.delete(key);
  }
  local.set(jti, expiresAtSeconds);

  const sb = supabase();
  if (!sb || tableMissing) return;

  try {
    const { error } = await sb
      .from("admin_revoked_sessions")
      .upsert({ jti, expires_at: new Date(expiresAtSeconds * 1000).toISOString() });
    if (error) {
      if (error.code === "42P01" || error.code === "PGRST205") {
        tableMissing = true;
      }
      warnOnce(`could not persist revocation: ${error.message}`);
      return;
    }
    // Opportunistic cleanup keeps the table tiny.
    await sb
      .from("admin_revoked_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString());
  } catch {
    // Local memory already blocks the token on this process.
  }
}
