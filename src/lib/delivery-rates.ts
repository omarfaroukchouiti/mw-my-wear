import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { deliveryFee, getWilaya, wilayas, type DeliveryMode } from "./algeria";

/**
 * Delivery pricing lives in one place — the database — so the owner can change
 * a fee from the dashboard without a deploy, and the server still recomputes
 * every total from its own copy (never from the browser).
 *
 * Missing rows fall back to the launch tariffs in algeria.ts. Those are
 * placeholders: the owner must replace them with the carrier's real tariff.
 */

export type DeliveryRate = { code: number; home: number; desk: number };

export type RateTable = Map<number, { home: number; desk: number }>;

/** 100,000 DZD is well above any plausible Algerian delivery fee. */
export const MAX_FEE = 100_000;

export function defaultRate(code: number): { home: number; desk: number } | null {
  const wilaya = getWilaya(code);
  if (!wilaya) return null;
  return { home: deliveryFee(code, "home"), desk: deliveryFee(code, "desk") };
}

export const defaultRates: DeliveryRate[] = wilayas.map((wilaya) => ({
  code: wilaya.code,
  ...defaultRate(wilaya.code)!,
}));

export function isFee(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_FEE;
}

export function normalizeRate(input: unknown): DeliveryRate | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { code?: unknown; home?: unknown; desk?: unknown };
  const code = Number(raw.code);
  const home = Number(raw.home);
  const desk = Number(raw.desk);
  if (!getWilaya(code) || !isFee(home) || !isFee(desk)) return null;
  return { code, home, desk };
}

export function rateTableFrom(entries: DeliveryRate[]): RateTable {
  const table: RateTable = new Map();
  for (const entry of defaultRates) table.set(entry.code, { home: entry.home, desk: entry.desk });
  for (const entry of entries) {
    const rate = normalizeRate(entry);
    if (rate) table.set(rate.code, { home: rate.home, desk: rate.desk });
  }
  return table;
}

export function ratesToArray(table: RateTable): DeliveryRate[] {
  return [...table.entries()]
    .map(([code, rate]) => ({ code, home: rate.home, desk: rate.desk }))
    .sort((a, b) => a.code - b.code);
}

export function feeFrom(table: RateTable, code: number, mode: DeliveryMode): number {
  const rate = table.get(code);
  if (rate) return mode === "desk" ? rate.desk : rate.home;
  return deliveryFee(code, mode);
}

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

export class RatesUnavailableError extends Error {
  constructor() {
    super("rates_storage_not_configured");
    this.name = "RatesUnavailableError";
  }
}

const RATES_FILE = process.env.DELIVERY_RATES_FILE ?? ".data/delivery-rates.json";
const CACHE_MS = 30_000;

type Cache = { table: RateTable; at: number };
const CACHE_KEY = "__mwDeliveryRatesCache" as const;

function cacheSlot(): { value?: Cache } {
  const store = globalThis as unknown as Record<string, { value?: Cache }>;
  store[CACHE_KEY] ??= {};
  return store[CACHE_KEY];
}

let warned = false;

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type RateRow = { wilaya_code: number; home_fee: number; desk_fee: number };

async function readLocal(): Promise<DeliveryRate[]> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    const raw = await readFile(
      path.resolve(/* turbopackIgnore: true */ process.cwd(), RATES_FILE),
      "utf8",
    );
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) =>
        normalizeRate({
          code: (entry as { code?: unknown }).code,
          home: (entry as { home?: unknown }).home,
          desk: (entry as { desk?: unknown }).desk,
        }),
      )
      .filter((entry): entry is DeliveryRate => entry !== null);
  } catch {
    return [];
  }
}

async function writeLocal(entries: DeliveryRate[]): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const file = path.resolve(/* turbopackIgnore: true */ process.cwd(), RATES_FILE);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(entries, null, 2), "utf8");
}

/**
 * Effective rates: database rows over the launch defaults. Never throws — a
 * database hiccup must not stop a customer from checking out.
 */
export async function loadRates(): Promise<RateTable> {
  const slot = cacheSlot();
  const now = Date.now();
  if (slot.value && now - slot.value.at < CACHE_MS) return slot.value.table;

  const sb = supabase();
  let entries: DeliveryRate[] = [];

  if (sb) {
    const { data, error } = await sb
      .from("delivery_rates")
      .select("wilaya_code,home_fee,desk_fee");

    if (error) {
      if (!warned) {
        warned = true;
        console.warn(
          "[delivery-rates] could not read delivery_rates — run supabase/migrations/004_delivery_rates.sql. " +
            "Using the launch defaults for now.",
        );
      }
    } else {
      entries = ((data ?? []) as RateRow[])
        .map((row) =>
          normalizeRate({
            code: row.wilaya_code,
            home: row.home_fee,
            desk: row.desk_fee,
          }),
        )
        .filter((entry): entry is DeliveryRate => entry !== null);
    }
  } else {
    entries = await readLocal();
  }

  const table = rateTableFrom(entries);
  slot.value = { table, at: now };
  return table;
}

/** Persist the given rows and return the fresh effective table. */
export async function saveRates(input: DeliveryRate[]): Promise<RateTable> {
  const entries: DeliveryRate[] = [];
  const seen = new Set<number>();
  for (const raw of input) {
    const rate = normalizeRate(raw);
    if (!rate) throw new Error("invalid_rate");
    if (seen.has(rate.code)) throw new Error("duplicate_wilaya");
    seen.add(rate.code);
    entries.push(rate);
  }
  if (entries.length === 0) throw new Error("no_rates");

  const sb = supabase();
  if (sb) {
    const { error } = await sb.from("delivery_rates").upsert(
      entries.map((entry) => ({
        wilaya_code: entry.code,
        home_fee: entry.home,
        desk_fee: entry.desk,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "wilaya_code" },
    );
    if (error) {
      // A missing table means migration 004 was not applied yet. Treat it like
      // any other "storage not ready" case so the dashboard can explain it.
      if (error.code === "42P01" || /could not find the table/i.test(error.message)) {
        throw new RatesUnavailableError();
      }
      throw new Error(`delivery_rates: ${error.message}`);
    }
  } else {
    if (process.env.NODE_ENV === "production" && !process.env.DELIVERY_RATES_FILE) {
      throw new RatesUnavailableError();
    }
    const current = rateTableFrom(await readLocal());
    for (const entry of entries) {
      current.set(entry.code, { home: entry.home, desk: entry.desk });
    }
    await writeLocal(ratesToArray(current));
  }

  // Re-read so the returned table also contains rows that were already custom
  // and were not part of this save.
  cacheSlot().value = undefined;
  return loadRates();
}

/** Used by the admin page to show which rows differ from the launch defaults. */
export function isCustomRate(table: RateTable, code: number): boolean {
  const fallback = defaultRate(code);
  const current = table.get(code);
  if (!fallback || !current) return false;
  return current.home !== fallback.home || current.desk !== fallback.desk;
}
