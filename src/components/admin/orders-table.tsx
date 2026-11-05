"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { StatusPill } from "@/components/admin/status-pill";
import type { Dictionary, Locale } from "@/lib/i18n";
import type { OrderPage, OrderStatus } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

const STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

export function AdminOrders({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const t = dict.admin;

  const [data, setData] = useState<OrderPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [applied, setApplied] = useState({ q: "", status: "" });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(false);
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (applied.q) params.set("q", applied.q);
        if (applied.status) params.set("status", applied.status);
        const response = await fetch(`/api/admin/orders?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        if (!response.ok) throw new Error("request");
        const payload = (await response.json()) as OrderPage;
        if (!cancelled) setData(payload);
      } catch (cause) {
        if (!cancelled && (cause as Error)?.name !== "AbortError") setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [applied, page, locale, router]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setApplied({ q: q.trim(), status });
  };

  const clear = () => {
    setQ("");
    setStatus("");
    setPage(1);
    setApplied({ q: "", status: "" });
  };

  const orders = data?.orders ?? [];
  const date = (value: string) =>
    new Date(value).toLocaleString(locale === "ar" ? "ar-DZ" : "en-GB", {
      dateStyle: "short",
      timeStyle: "short",
    });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mw-eyebrow">{dict.admin.storedIn}</p>
          <p className="mt-1 text-[12px] text-ink-soft">
            {data?.driver === "supabase" ? t.supabase : t.local}
            {data && data.driver === "local" && (
              <span className="block max-w-lg text-[10px] leading-relaxed">{t.localNote}</span>
            )}
          </p>
        </div>
        {data && (
          <p className="text-[11px] tabular-nums text-ink-soft">
            {data.total} {t.found}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-3 border border-line p-4 sm:grid-cols-[1fr_180px_auto]">
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={t.search}
          className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
        >
          <option value="">{t.allStatuses}</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {dict.status[item]}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button type="submit" className="mw-btn mw-btn-solid flex-1 whitespace-nowrap">
            {t.searchCta}
          </button>
          <button
            type="button"
            onClick={clear}
            className="border border-line px-3 text-[10px] uppercase tracking-[0.15em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            {t.clear}
          </button>
        </div>
      </form>

      {loading && <p className="py-16 text-center text-sm text-ink-soft">{t.loading}</p>}

      {!loading && error && (
        <p className="mt-6 border border-red-600 bg-red-50 px-4 py-3 text-xs text-red-700">
          {t.error}
        </p>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="mt-6 border border-dashed border-line py-16 text-center text-sm text-ink-soft">
          {t.empty}
        </p>
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="mt-6 overflow-x-auto border border-line">
          <table className="w-full min-w-[820px] border-collapse text-start">
            <thead>
              <tr className="border-b border-line bg-paper-dim text-[9px] uppercase tracking-[0.18em] text-ink-soft">
                <th className="px-3 py-3 text-start font-medium">#</th>
                <th className="px-3 py-3 text-start font-medium">{t.orderDate}</th>
                <th className="px-3 py-3 text-start font-medium">{t.customer}</th>
                <th className="px-3 py-3 text-start font-medium">{t.wilaya}</th>
                <th className="px-3 py-3 text-center font-medium">{t.items}</th>
                <th className="px-3 py-3 text-center font-medium">{t.designs}</th>
                <th className="px-3 py-3 text-end font-medium">{t.total}</th>
                <th className="px-3 py-3 text-start font-medium">{t.status}</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => {
                const designs = order.items.reduce((sum, item) => {
                  return sum + (item.front?.preview ? 1 : 0) + (item.back?.preview ? 1 : 0);
                }, 0);
                return (
                  <tr key={order.number} className="align-top text-[12px] hover:bg-paper-dim/60">
                    <td className="whitespace-nowrap px-3 py-4 font-semibold" dir="ltr">
                      {order.number}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-[10px] text-ink-soft">
                      {date(order.createdAt)}
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold">{order.customer.name}</p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-ink-soft" dir="ltr">
                        {order.customer.phone}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-[11px]">
                      {locale === "ar" ? order.customer.wilayaAr : order.customer.wilayaEn}
                      <span className="block text-[10px] text-ink-soft">{order.customer.commune}</span>
                    </td>
                    <td className="px-3 py-4 text-center text-[11px] tabular-nums">
                      {order.items.reduce((sum, item) => sum + item.qty, 0)}
                    </td>
                    <td className="px-3 py-4 text-center text-[11px] tabular-nums">
                      {designs > 0 ? designs : <span className="text-ink-soft">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-end text-[11px] tabular-nums">
                      {formatPrice(order.total, locale)}
                    </td>
                    <td className="px-3 py-4">
                      <StatusPill status={order.status} dict={dict} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-end">
                      <Link
                        href={`/${locale}/admin/orders/${order.number}`}
                        className="text-[10px] uppercase tracking-[0.15em] underline decoration-line underline-offset-4 hover:decoration-ink"
                      >
                        {t.view}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-ink-soft">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page <= 1}
            className="border border-line px-3 py-1.5 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
          >
            {t.prev}
          </button>
          <span className="tabular-nums">
            {t.page} {data.page} {t.of} {data.pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
            disabled={page >= data.pages}
            className="border border-line px-3 py-1.5 transition-colors hover:border-ink hover:text-ink disabled:opacity-40"
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
