"use client";

import { useEffect, useMemo, useState } from "react";

import { deliveryFee, isNewWilaya, wilayas, type Wilaya } from "@/lib/algeria";
import type { Dictionary, Locale } from "@/lib/i18n";

type Row = { home: string; desk: string };
type Rate = { home: number; desk: number };

function defaults(): Record<number, Rate> {
  const table: Record<number, Rate> = {};
  for (const wilaya of wilayas) {
    table[wilaya.code] = {
      home: deliveryFee(wilaya.code, "home"),
      desk: deliveryFee(wilaya.code, "desk"),
    };
  }
  return table;
}

function toRows(table: Record<number, Rate>): Record<number, Row> {
  const rows: Record<number, Row> = {};
  for (const wilaya of wilayas) {
    const rate = table[wilaya.code] ?? defaults()[wilaya.code];
    rows[wilaya.code] = { home: String(rate.home), desk: String(rate.desk) };
  }
  return rows;
}

function parseFee(value: string): number | null {
  if (!/^\d{1,6}$/.test(value.trim())) return null;
  const fee = Number(value);
  if (!Number.isInteger(fee) || fee < 0 || fee > 100_000) return null;
  return fee;
}

export function AdminDeliveryRates({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.admin;
  const base = useMemo(defaults, []);
  const [rows, setRows] = useState<Record<number, Row>>(() => toRows(base));
  const [loaded, setLoaded] = useState<Record<number, Rate>>(base);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/delivery-rates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load");
        const data = (await response.json()) as { rates?: { code: number; home: number; desk: number }[] };
        if (!alive) return;
        const table = { ...base };
        for (const rate of data.rates ?? []) {
          if (table[rate.code]) table[rate.code] = { home: rate.home, desk: rate.desk };
        }
        setLoaded(table);
        setRows(toRows(table));
      })
      .catch(() => {
        if (alive) setMessage(t.deliveryLoadError);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [base, t.deliveryLoadError]);

  const dirty = useMemo(() => {
    const list: { code: number; home: number; desk: number }[] = [];
    for (const wilaya of wilayas) {
      const row = rows[wilaya.code];
      const current = loaded[wilaya.code] ?? base[wilaya.code];
      if (!row) continue;
      const home = parseFee(row.home);
      const desk = parseFee(row.desk);
      if (home === null || desk === null) continue;
      if (home !== current.home || desk !== current.desk) list.push({ code: wilaya.code, home, desk });
    }
    return list;
  }, [rows, loaded, base]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return wilayas;
    return wilayas.filter(
      (wilaya) =>
        String(wilaya.code).startsWith(needle) ||
        wilaya.ar.includes(needle) ||
        wilaya.en.toLowerCase().includes(needle),
    );
  }, [query]);

  const update = (code: number, field: keyof Row, value: string) => {
    setRows((current) => ({ ...current, [code]: { ...current[code], [field]: value } }));
    setSaved(false);
    setMessage(null);
  };

  const save = async () => {
    if (saving) return;

    for (const wilaya of wilayas) {
      const row = rows[wilaya.code];
      if (!row || parseFee(row.home) === null || parseFee(row.desk) === null) {
        setMessage(t.deliveryInvalid);
        return;
      }
    }

    if (dirty.length === 0) {
      setSaved(true);
      setMessage(null);
      window.setTimeout(() => setSaved(false), 2500);
      return;
    }

    setSaving(true);
    setMessage(null);
    setSaved(false);
    try {
      const response = await fetch("/api/admin/delivery-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rates: dirty }),
      });
      if (!response.ok) {
        setMessage(response.status === 503 ? t.deliveryNotReady : t.deliveryError);
        return;
      }
      const data = (await response.json()) as { rates?: { code: number; home: number; desk: number }[] };
      const table = { ...base };
      for (const rate of data.rates ?? []) {
        if (table[rate.code]) table[rate.code] = { home: rate.home, desk: rate.desk };
      }
      setLoaded(table);
      setRows(toRows(table));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setMessage(t.deliveryError);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setRows(toRows(base));
    setSaved(false);
    setMessage(t.deliveryResetHint);
  };

  const customCount = wilayas.filter((wilaya) => {
    const current = loaded[wilaya.code];
    const fallback = base[wilaya.code];
    return current && (current.home !== fallback.home || current.desk !== fallback.desk);
  }).length;

  return (
    <div className="space-y-6">
      <div className="border border-line bg-paper-dim p-4">
        <p className="text-[12px] leading-relaxed text-ink-soft">{t.deliveryNote}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">{t.deliveryNewNote}</p>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="block w-full max-w-xs">
          <span className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-ink-soft">
            {t.deliverySearch}
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.deliverySearch}
            className="w-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] tabular-nums text-ink-soft">
            {wilayas.length} {t.deliveryCount} · {customCount} {t.deliveryCustom}
          </span>
          <button
            type="button"
            onClick={reset}
            disabled={loading || saving}
            className="border border-line px-3 py-2 text-[11px] transition-colors hover:border-ink disabled:opacity-50"
          >
            {t.deliveryReset}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={loading || saving}
            className="mw-btn mw-btn-solid px-4 py-2 text-[11px] disabled:opacity-50"
          >
            {saving ? t.deliverySaving : t.deliverySave}
          </button>
        </div>
      </div>

      {message && <p className="text-[11px] text-red-700">{message}</p>}
      {saved && <p className="text-[11px] text-green-700">{t.deliverySaved}</p>}
      {loading && <p className="text-[11px] text-ink-soft">{t.loading}</p>}

      <div className="overflow-x-auto border border-line">
        <div className="min-w-[520px]">
          <div className="grid grid-cols-[1fr_100px_100px] gap-2 border-b border-line bg-paper-dim px-3 py-2 text-[10px] uppercase tracking-[0.15em] text-ink-soft">
            <span>{t.deliveryWilaya}</span>
            <span className="text-center">{t.deliveryHome}</span>
            <span className="text-center">{t.deliveryDesk}</span>
          </div>

          {filtered.map((wilaya) => {
            const row = rows[wilaya.code];
            const current = loaded[wilaya.code] ?? base[wilaya.code];
            const fallback = base[wilaya.code];
            const custom =
              current.home !== fallback.home || current.desk !== fallback.desk;
            return (
              <div
                key={wilaya.code}
                className={`grid grid-cols-[1fr_100px_100px] items-center gap-2 border-b border-line px-3 py-2 last:border-0 ${
                  isNewWilaya(wilaya) ? "bg-paper-dim/60" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold">
                    <span className="tabular-nums text-ink-soft">
                      {String(wilaya.code).padStart(2, "0")}
                    </span>{" "}
                    {locale === "ar" ? wilaya.ar : wilaya.en}
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-soft">
                    {isNewWilaya(wilaya) ? `${t.deliveryNew} · ${parentName(wilaya, locale)}` : ""}
                    {!isNewWilaya(wilaya) && custom ? t.deliveryCustom : ""}
                    {isNewWilaya(wilaya) && custom ? ` · ${t.deliveryCustom}` : ""}
                  </p>
                </div>

                {(["home", "desk"] as const).map((field) => (
                  <input
                    key={field}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100_000}
                    step={50}
                    value={row?.[field] ?? ""}
                    onChange={(event) => update(wilaya.code, field, event.target.value)}
                    aria-label={`${locale === "ar" ? wilaya.ar : wilaya.en} — ${
                      field === "home" ? t.deliveryHome : t.deliveryDesk
                    }`}
                    className="w-full border border-line bg-paper px-2 py-1.5 text-center text-[12px] tabular-nums outline-none focus:border-ink"
                  />
                ))}
              </div>
            );
          })}

          {filtered.length === 0 && (
            <p className="px-3 py-8 text-center text-[11px] text-ink-soft">{t.deliveryEmpty}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function parentName(wilaya: Wilaya, locale: Locale): string {
  if (!wilaya.parentCode) return "";
  const parent = wilayas.find((item) => item.code === wilaya.parentCode);
  if (!parent) return "";
  return `${locale === "ar" ? "الولاية الأم:" : "Parent:"} ${
    locale === "ar" ? parent.ar : parent.en
  }`;
}
