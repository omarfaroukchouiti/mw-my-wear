import { randomBytes } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { deliveryFee, getWilaya, type DeliveryMode } from "./algeria";
import type { Locale } from "./i18n";
import {
  allowedNextStatuses,
  canTransition,
  isOrderStatus,
  ORDER_STATUSES,
  type OrderStatus,
} from "./order-status";
import { getProduct } from "./products";

export type { OrderStatus } from "./order-status";
export { allowedNextStatuses, canTransition, ORDER_STATUSES } from "./order-status";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type OrderDesign = {
  /** Serialized fabric.js scene for this side. */
  design?: string;
  /** Small PNG preview of this side. */
  preview?: string;
};

export type OrderItem = {
  slug: string;
  nameAr: string;
  nameEn: string;
  type: string;
  colorHex: string;
  colorNameAr: string;
  colorNameEn: string;
  size: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  front?: OrderDesign;
  back?: OrderDesign;
};

export type StatusChange = {
  from: OrderStatus | null;
  to: OrderStatus;
  at: string;
};

export type StoredOrder = {
  number: string;
  createdAt: string;
  status: OrderStatus;
  locale: Locale;
  customer: {
    name: string;
    phone: string;
    wilayaCode: number;
    wilayaAr: string;
    wilayaEn: string;
    commune: string;
    address: string;
    delivery: DeliveryMode;
    notes: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  /** Storage bookkeeping for the local fallback; never sent to customers. */
  idempotencyKey?: string;
  /** Admin-only audit trail, filled by getOrder(). */
  statusHistory?: StatusChange[];
};

export type OrderInput = {
  locale: Locale;
  customer: {
    name: string;
    phone: string;
    wilayaCode: number;
    commune: string;
    address: string;
    delivery: DeliveryMode;
    notes?: string;
  };
  items: Array<{
    slug: string;
    colorHex: string;
    size: string;
    qty: number;
    front?: OrderDesign;
    back?: OrderDesign;
  }>;
};

export type ValidationFailure = { ok: false; fields: string[]; reason: string };

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const MAX_PREVIEW = 400_000;
const MAX_DESIGN = 1_600_000;
const MAX_ITEMS = 20;
const MAX_QTY = 20;

/**
 * Normalize an Algerian mobile number to the local 10-digit form (0X XX XX XX XX).
 * Accepts 05/06/07 numbers written with spaces, dashes, +213 or 00213 prefixes.
 * Landlines are intentionally rejected: orders need a reachable mobile.
 */
export function normalizePhone(raw: string): string | null {
  let value = String(raw ?? "").trim();
  if (!value) return null;
  // Arabic-Indic digits are common in copied text.
  value = value.replace(/[\u0660-\u0669]/g, (digit) =>
    String.fromCharCode(digit.charCodeAt(0) - 0x0660 + 48),
  );
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("00213")) digits = digits.slice(5);
  if (digits.startsWith("213")) digits = digits.slice(3);
  if (digits.length === 9 && /^[5-7]/.test(digits)) digits = `0${digits}`;
  if (!/^0[5-7]\d{8}$/.test(digits)) return null;
  return digits;
}

/** Collapse whitespace, drop control characters, trim and cap the length. */
function cleanText(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028\u2029]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** A name needs at least two letters, in Arabic or Latin script. */
function looksLikeName(value: string): boolean {
  const letters = value.match(/[\p{L}]/gu)?.length ?? 0;
  return letters >= 2;
}

function readDesign(value: unknown): OrderDesign | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = value as { design?: unknown; preview?: unknown };
  const design =
    typeof raw.design === "string" && raw.design && raw.design.length <= MAX_DESIGN
      ? raw.design
      : undefined;
  const preview =
    typeof raw.preview === "string" &&
    raw.preview.startsWith("data:image/") &&
    raw.preview.length <= MAX_PREVIEW
      ? raw.preview
      : undefined;
  if (!design && !preview) return undefined;
  return { design, preview };
}

export type FeeLookup = (code: number, mode: DeliveryMode) => number;

export function validateOrder(
  input: unknown,
  feeFor: FeeLookup = deliveryFee,
): { ok: true; order: StoredOrder } | ValidationFailure {
  const fields: string[] = [];
  const fail = (reason: string): ValidationFailure => ({ ok: false, fields, reason });

  if (!input || typeof input !== "object") return fail("body");
  const data = input as Partial<OrderInput>;

  /* customer ------------------------------------------------------- */
  const customer = data.customer;
  if (!customer || typeof customer !== "object") return fail("customer");

  const name = cleanText(customer.name, 60);
  if (name.length < 3 || !looksLikeName(name)) fields.push("name");

  const phone = normalizePhone(String(customer.phone ?? ""));
  if (!phone) fields.push("phone");

  const wilayaCode = Number(customer.wilayaCode);
  const wilaya = getWilaya(wilayaCode);
  if (!wilaya) fields.push("wilaya");

  const commune = cleanText(customer.commune, 60);
  if (commune.length < 2) fields.push("commune");

  const address = cleanText(customer.address, 200);
  if (address.length < 5) fields.push("address");

  const delivery: DeliveryMode = customer.delivery === "desk" ? "desk" : "home";
  const notes = cleanText(customer.notes, 500);

  /* items ---------------------------------------------------------- */
  if (!Array.isArray(data.items) || data.items.length === 0) fields.push("items");
  const rawItems = Array.isArray(data.items) ? data.items.slice(0, MAX_ITEMS) : [];
  if (Array.isArray(data.items) && data.items.length > MAX_ITEMS) fields.push("items");

  const items: OrderItem[] = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== "object") {
      fields.push("items");
      continue;
    }
    const line = raw as OrderInput["items"][number];
    const product = getProduct(String(line.slug ?? ""));
    if (!product) {
      fields.push("items");
      continue;
    }
    const color = product.colors.find(
      (item) => item.hex.toLowerCase() === String(line.colorHex ?? "").trim().toLowerCase(),
    );
    if (!color) {
      fields.push("items");
      continue;
    }
    const size = cleanText(line.size, 8).toUpperCase();
    if (!product.sizes.includes(size)) {
      fields.push("items");
      continue;
    }
    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QTY) {
      fields.push("items");
      continue;
    }
    items.push({
      slug: product.slug,
      nameAr: product.name.ar,
      nameEn: product.name.en,
      type: product.type,
      colorHex: color.hex,
      colorNameAr: color.name.ar,
      colorNameEn: color.name.en,
      size,
      qty,
      unitPrice: product.price,
      lineTotal: product.price * qty,
      front: readDesign(line.front),
      back: readDesign(line.back),
    });
  }

  if (fields.length) return fail("validation");

  /* totals --------------------------------------------------------- */
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const fee = feeFor(wilaya!.code, delivery);
  const locale: Locale = data.locale === "en" ? "en" : "ar";

  return {
    ok: true,
    order: {
      number: "",
      createdAt: new Date().toISOString(),
      status: "new",
      locale,
      customer: {
        name,
        phone: phone!,
        wilayaCode: wilaya!.code,
        wilayaAr: wilaya!.ar,
        wilayaEn: wilaya!.en,
        commune,
        address,
        delivery,
        notes,
      },
      items,
      subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Order numbers                                                       */
/* ------------------------------------------------------------------ */

function randomChunk(size: number): string {
  // Cryptographically random: order numbers are part of the public tracking key.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(size * 2);
  let out = "";
  for (let index = 0; index < bytes.length && out.length < size; index += 1) {
    out += alphabet[bytes[index] % alphabet.length];
  }
  return out;
}

export function makeOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  return `MW-${stamp}${randomChunk(3)}`;
}

/* ------------------------------------------------------------------ */
/* Storage: Supabase when configured, local JSON file otherwise        */
/* ------------------------------------------------------------------ */

const STORE_FILE = process.env.ORDERS_FILE ?? ".data/orders.json";

/**
 * Thrown when no durable storage is configured. In production the local JSON
 * fallback is refused unless ORDERS_FILE is set explicitly: serverless hosts do
 * not keep local files, so accepting an order there would silently lose it.
 */
export class StorageUnavailableError extends Error {
  constructor() {
    super("storage_not_configured");
    this.name = "StorageUnavailableError";
  }
}

function assertLocalFallback(): void {
  if (process.env.NODE_ENV === "production" && !process.env.ORDERS_FILE) {
    throw new StorageUnavailableError();
  }
}

let client: SupabaseClient | null = null;

function supabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export function storageDriver(): "supabase" | "local" {
  return supabase() ? "supabase" : "local";
}

/** True when orders can actually be stored. Used by the admin status line. */
export function storageReady(): boolean {
  return Boolean(supabase()) || process.env.NODE_ENV !== "production" || Boolean(process.env.ORDERS_FILE);
}

type OrderRow = {
  number: string;
  created_at: string;
  status: OrderStatus;
  locale: string;
  customer_name: string;
  phone: string;
  wilaya_code: number;
  wilaya_ar: string;
  wilaya_en: string;
  commune: string;
  address: string;
  delivery: DeliveryMode;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  order_items?: ItemRow[];
  order_status_history?: HistoryRow[];
};

type HistoryRow = {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_at: string;
};

type ItemRow = {
  position: number;
  slug: string;
  name_ar: string;
  name_en: string;
  type: string;
  color_hex: string;
  color_name_ar: string;
  color_name_en: string;
  size: string;
  qty: number;
  unit_price: number;
  line_total: number;
  preview_front: string | null;
  preview_back: string | null;
  design_front: string | null;
  design_back: string | null;
};

function toRow(order: StoredOrder): OrderRow {
  return {
    number: order.number,
    created_at: order.createdAt,
    status: order.status,
    locale: order.locale,
    customer_name: order.customer.name,
    phone: order.customer.phone,
    wilaya_code: order.customer.wilayaCode,
    wilaya_ar: order.customer.wilayaAr,
    wilaya_en: order.customer.wilayaEn,
    commune: order.customer.commune,
    address: order.customer.address,
    delivery: order.customer.delivery,
    notes: order.customer.notes,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
  };
}

function toItemRows(order: StoredOrder): ItemRow[] {
  return order.items.map((item, index) => ({
    position: index,
    slug: item.slug,
    name_ar: item.nameAr,
    name_en: item.nameEn,
    type: item.type,
    color_hex: item.colorHex,
    color_name_ar: item.colorNameAr,
    color_name_en: item.colorNameEn,
    size: item.size,
    qty: item.qty,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
    preview_front: item.front?.preview ?? null,
    preview_back: item.back?.preview ?? null,
    design_front: item.front?.design ?? null,
    design_back: item.back?.design ?? null,
  }));
}

function fromRows(row: OrderRow, items: ItemRow[]): StoredOrder {
  return {
    number: row.number,
    createdAt: row.created_at,
    status: row.status,
    locale: row.locale === "en" ? "en" : "ar",
    customer: {
      name: row.customer_name,
      phone: row.phone,
      wilayaCode: row.wilaya_code,
      wilayaAr: row.wilaya_ar,
      wilayaEn: row.wilaya_en,
      commune: row.commune,
      address: row.address,
      delivery: row.delivery,
      notes: row.notes ?? "",
    },
    items: items
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((item) => ({
        slug: item.slug,
        nameAr: item.name_ar,
        nameEn: item.name_en,
        type: item.type,
        colorHex: item.color_hex,
        colorNameAr: item.color_name_ar,
        colorNameEn: item.color_name_en,
        size: item.size,
        qty: item.qty,
        unitPrice: item.unit_price,
        lineTotal: item.line_total,
        front:
          item.design_front || item.preview_front
            ? { design: item.design_front ?? undefined, preview: item.preview_front ?? undefined }
            : undefined,
        back:
          item.design_back || item.preview_back
            ? { design: item.design_back ?? undefined, preview: item.preview_back ?? undefined }
            : undefined,
      })),
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
  };
}

/* local file ------------------------------------------------------- */

let writeQueue: Promise<unknown> = Promise.resolve();

async function readLocal(): Promise<StoredOrder[]> {
  const { readFile } = await import("node:fs/promises");
  const path = await import("node:path");
  try {
    const raw = await readFile(path.resolve(/* turbopackIgnore: true */ process.cwd(), STORE_FILE), "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredOrder[]) : [];
  } catch {
    return [];
  }
}

async function writeLocal(orders: StoredOrder[]): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const path = await import("node:path");
  const file = path.resolve(/* turbopackIgnore: true */ process.cwd(), STORE_FILE);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(orders, null, 2), "utf8");
}

/* public API ------------------------------------------------------- */

export type SaveResult = { order: StoredOrder; replayed: boolean };

/** Set once the create_order RPC is missing, so we probe only one time. */
let rpcUnavailable = false;

function isMissingRpc(error: { code?: string; message?: string; status?: number }): boolean {
  return (
    error.code === "PGRST202" ||
    error.code === "42883" ||
    error.status === 404 ||
    /could not find the function|function .* does not exist/i.test(error.message ?? "")
  );
}

/** Write the order and its items in two statements. Pre-migration fallback. */
async function insertOrderLegacy(sb: SupabaseClient, order: StoredOrder): Promise<StoredOrder> {
  let number = makeOrderNumber();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const stored: StoredOrder = { ...order, number, createdAt: new Date().toISOString() };
    const { error } = await sb.from("orders").insert(toRow(stored));
    if (!error) {
      const { error: itemsError } = await sb.from("order_items").insert(
        toItemRows(stored).map((row) => ({ ...row, order_number: number })),
      );
      if (!itemsError) return stored;
      await sb.from("orders").delete().eq("number", number);
      throw new Error(`order_items: ${itemsError.message}`);
    }
    if (error.code !== "23505") throw new Error(`orders: ${error.message}`);
    number = makeOrderNumber();
  }
  throw new Error("orders: could not allocate an order number");
}

/**
 * Persist an order.
 *
 * With Supabase and migration 003 in place, this runs the `create_order` RPC:
 * the order row, its items and the first history row are written in a single
 * transaction, and a repeated Idempotency-Key returns the original order
 * instead of creating a second one.
 *
 * Before the migration (or on the local file fallback) it degrades to the
 * previous behaviour, where a retry is only deduplicated inside one process.
 */
export async function saveOrder(
  order: StoredOrder,
  idempotencyKey?: string | null,
): Promise<SaveResult> {
  const key =
    idempotencyKey && /^[A-Za-z0-9_-]{16,64}$/.test(idempotencyKey) ? idempotencyKey : null;
  const sb = supabase();

  if (sb) {
    if (!rpcUnavailable) {
      const { data, error } = await sb.rpc("create_order", {
        p_order: { ...toRow(order), number: makeOrderNumber() },
        p_items: toItemRows(order),
        p_key: key,
      });

      if (!error) {
        const result = data as { number?: string; replayed?: boolean } | null;
        if (!result?.number) throw new Error("orders: create_order returned no order");
        const stored = await getOrder(result.number);
        if (!stored) throw new Error("orders: created order could not be read back");
        return { order: stored, replayed: Boolean(result.replayed) };
      }

      if (!isMissingRpc(error)) throw new Error(`create_order: ${error.message}`);

      rpcUnavailable = true;
      console.warn(
        "[orders] create_order RPC is missing — run supabase/migrations/003_order_integrity.sql. " +
          "Using the non-atomic fallback for now.",
      );
    }

    return { order: await insertOrderLegacy(sb, order), replayed: false };
  }

  assertLocalFallback();

  const task = writeQueue.then(async (): Promise<SaveResult> => {
    const orders = await readLocal();
    if (key) {
      const replayed = orders.find((existing) => existing.idempotencyKey === key);
      if (replayed) return { order: replayed, replayed: true };
    }
    let number = makeOrderNumber();
    while (orders.some((existing) => existing.number === number)) number = makeOrderNumber();
    const stored: StoredOrder = {
      ...order,
      number,
      createdAt: new Date().toISOString(),
      ...(key ? { idempotencyKey: key } : {}),
      statusHistory: [{ from: null, to: "new", at: new Date().toISOString() }],
    };
    orders.push(stored);
    await writeLocal(orders);
    return { order: stored, replayed: false };
  });
  writeQueue = task.catch(() => undefined);
  return task;
}

export async function findOrder(number: string, phone: string): Promise<StoredOrder | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const wanted = String(number ?? "").trim().toUpperCase();
  if (!/^MW-[A-Z0-9]{5,12}$/.test(wanted)) return null;

  const sb = supabase();
  if (sb) {
    const { data, error } = await sb
      .from("orders")
      .select("*, order_items(*)")
      .eq("number", wanted)
      .eq("phone", normalized)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as OrderRow;
    return fromRows(row, (row.order_items ?? []) as ItemRow[]);
  }

  assertLocalFallback();
  const orders = await readLocal();
  return (
    orders.find((order) => order.number === wanted && order.customer.phone === normalized) ?? null
  );
}

/** Order without the heavy design files, safe to send to the customer. */
export function publicOrder(order: StoredOrder): StoredOrder {
  const { idempotencyKey: _key, statusHistory: _history, ...safe } = order;
  return {
    ...safe,
    items: safe.items.map((item) => ({
      ...item,
      front: item.front?.preview ? { preview: item.front.preview } : undefined,
      back: item.back?.preview ? { preview: item.back.preview } : undefined,
    })),
  };
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export type OrderPage = {
  orders: StoredOrder[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
  driver: "supabase" | "local";
};

/** Columns for the list view: everything except the (large) design JSON. */
const LIST_COLUMNS = [
  "number",
  "created_at",
  "status",
  "locale",
  "customer_name",
  "phone",
  "wilaya_code",
  "wilaya_ar",
  "wilaya_en",
  "commune",
  "address",
  "delivery",
  "notes",
  "subtotal",
  "delivery_fee",
  "total",
  "order_items(position,slug,name_ar,name_en,type,color_hex,color_name_ar,color_name_en,size,qty,unit_price,line_total,preview_front,preview_back)",
].join(",");

function sanitizeQuery(raw: string | undefined): string {
  return String(raw ?? "")
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .trim()
    .slice(0, 60);
}

export async function listOrders(options: {
  status?: string;
  query?: string;
  page?: number;
  perPage?: number;
}): Promise<OrderPage> {
  const perPage = Math.min(50, Math.max(5, Math.floor(options.perPage ?? 20)));
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const status = ORDER_STATUSES.includes(options.status as OrderStatus)
    ? (options.status as OrderStatus)
    : undefined;
  const query = sanitizeQuery(options.query);

  const sb = supabase();
  if (sb) {
    let request = sb.from("orders").select(LIST_COLUMNS, { count: "exact" });
    if (status) request = request.eq("status", status);
    if (query) {
      request = request.or(
        `number.ilike.%${query}%,phone.ilike.%${query}%,customer_name.ilike.%${query}%`,
      );
    }
    const from = (page - 1) * perPage;
    const { data, error, count } = await request
      .order("created_at", { ascending: false })
      .range(from, from + perPage - 1);
    if (error) throw new Error(`orders: ${error.message}`);

    const orders = ((data ?? []) as unknown as OrderRow[]).map((row) =>
      publicOrder(fromRows(row, row.order_items ?? [])),
    );
    const total = count ?? orders.length;
    return {
      orders,
      total,
      page,
      perPage,
      pages: Math.max(1, Math.ceil(total / perPage)),
      driver: "supabase",
    };
  }

  assertLocalFallback();
  const all = (await readLocal()).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const needle = query.toLowerCase();
  const filtered = all.filter((order) => {
    if (status && order.status !== status) return false;
    if (!needle) return true;
    return (
      order.number.toLowerCase().includes(needle) ||
      order.customer.phone.includes(needle) ||
      order.customer.name.toLowerCase().includes(needle)
    );
  });
  const total = filtered.length;
  return {
    orders: filtered.slice((page - 1) * perPage, page * perPage).map(publicOrder),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    driver: "local",
  };
}

const ORDER_COLUMNS = "*, order_items(*)";
const ORDER_COLUMNS_WITH_HISTORY =
  "*, order_items(*), order_status_history(from_status,to_status,changed_at)";

function isMissingHistory(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST200" ||
    error.code === "42P01" ||
    /order_status_history/.test(error.message ?? "")
  );
}

function withHistory(row: OrderRow): StoredOrder {
  const order = fromRows(row, (row.order_items ?? []) as ItemRow[]);
  if (row.order_status_history) {
    order.statusHistory = row.order_status_history
      .slice()
      .sort((a, b) => a.changed_at.localeCompare(b.changed_at))
      .map((entry) => ({
        from: entry.from_status ?? null,
        to: entry.to_status,
        at: entry.changed_at,
      }));
  }
  return order;
}

/** Full order including design JSON and status history. Admin only. */
export async function getOrder(number: string): Promise<StoredOrder | null> {
  const wanted = String(number ?? "").trim().toUpperCase();
  if (!/^MW-[A-Z0-9]{5,12}$/.test(wanted)) return null;

  const sb = supabase();
  if (sb) {
    let result = await sb.from("orders").select(ORDER_COLUMNS_WITH_HISTORY).eq("number", wanted).maybeSingle();
    if (result.error && isMissingHistory(result.error)) {
      // Migration 003 has not run yet: the order still loads, without history.
      result = await sb.from("orders").select(ORDER_COLUMNS).eq("number", wanted).maybeSingle();
    }
    if (result.error || !result.data) return null;
    return withHistory(result.data as unknown as OrderRow);
  }

  assertLocalFallback();
  const orders = await readLocal();
  return orders.find((order) => order.number === wanted) ?? null;
}

export type StatusUpdate =
  | { ok: true }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "invalid_transition"; current: OrderStatus; allowed: OrderStatus[] };

export async function updateOrderStatus(
  number: string,
  status: OrderStatus,
): Promise<StatusUpdate> {
  const wanted = String(number ?? "").trim().toUpperCase();
  if (!/^MW-[A-Z0-9]{5,12}$/.test(wanted)) return { ok: false, reason: "not_found" };
  if (!isOrderStatus(status)) return { ok: false, reason: "not_found" };

  const sb = supabase();
  if (sb) {
    const current = await sb.from("orders").select("status").eq("number", wanted).maybeSingle();
    if (current.error) throw new Error(`orders: ${current.error.message}`);
    if (!current.data) return { ok: false, reason: "not_found" };

    const from = (current.data as { status: OrderStatus }).status;
    if (from === status) return { ok: true };

    if (!canTransition(from, status)) {
      return {
        ok: false,
        reason: "invalid_transition",
        current: from,
        allowed: allowedNextStatuses(from),
      };
    }

    const { data, error } = await sb
      .from("orders")
      .update({ status })
      .eq("number", wanted)
      .select("number");

    if (error) {
      // The database trigger is the last line of defence: a concurrent update
      // may have moved the order between our read and our write.
      if (/invalid_status_transition/.test(error.message)) {
        const fresh = await sb.from("orders").select("status").eq("number", wanted).maybeSingle();
        const now = (fresh.data as { status: OrderStatus } | null)?.status ?? from;
        return {
          ok: false,
          reason: "invalid_transition",
          current: now,
          allowed: allowedNextStatuses(now),
        };
      }
      throw new Error(`orders: ${error.message}`);
    }
    if (!Array.isArray(data) || data.length === 0) return { ok: false, reason: "not_found" };
    return { ok: true };
  }

  assertLocalFallback();

  const task = writeQueue.then(async (): Promise<StatusUpdate> => {
    const orders = await readLocal();
    const target = orders.find((order) => order.number === wanted);
    if (!target) return { ok: false, reason: "not_found" };
    if (target.status === status) return { ok: true };
    if (!canTransition(target.status, status)) {
      return {
        ok: false,
        reason: "invalid_transition",
        current: target.status,
        allowed: allowedNextStatuses(target.status),
      };
    }
    const from = target.status;
    target.status = status;
    target.statusHistory = [
      ...(target.statusHistory ?? []),
      { from, to: status, at: new Date().toISOString() },
    ];
    await writeLocal(orders);
    return { ok: true };
  });
  writeQueue = task.catch(() => undefined);
  return task;
}
