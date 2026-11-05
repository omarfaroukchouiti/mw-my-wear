"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusPill } from "@/components/admin/status-pill";
import { downloadPrintFile } from "@/lib/download-print";
import type { Dictionary, Locale } from "@/lib/i18n";
import { allowedNextStatuses, isOpen } from "@/lib/order-status";
import type { OrderDesign, OrderStatus, StoredOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

export function AdminOrderDetail({
  number,
  locale,
  dict,
}: {
  number: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const router = useRouter();
  const t = dict.admin;

  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("new");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  /** The server refused a status change that the workflow does not allow. */
  const [conflict, setConflict] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/admin/orders/${encodeURIComponent(number)}`, {
          cache: "no-store",
        });
        if (response.status === 401) {
          router.replace(`/${locale}/admin/login`);
          return;
        }
        if (!response.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const data = (await response.json()) as { order: StoredOrder };
        if (!cancelled) {
          setOrder(data.order);
          setStatus(data.order.status);
        }
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [number, locale, router]);

  const save = async () => {
    if (!order || saving) return;
    setSaving(true);
    setSaveError(false);
    setConflict(false);
    setSaved(false);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.number)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (response.status === 409) {
        // Someone (or the database trigger) moved the order meanwhile.
        const data = (await response.json().catch(() => null)) as {
          current?: OrderStatus;
          allowed?: OrderStatus[];
        } | null;
        const current = data?.current ?? order.status;
        setOrder({ ...order, status: current });
        setStatus(current);
        setConflict(true);
        return;
      }
      if (!response.ok) throw new Error("save");
      setOrder({
        ...order,
        status,
        statusHistory: [
          ...(order.statusHistory ?? []),
          { from: order.status, to: status, at: new Date().toISOString() },
        ],
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const download = async (
    design: string,
    side: "front" | "back",
    index: number,
  ) => {
    if (!order) return;
    const key = `${index}-${side}`;
    setDownloading(key);
    setDownloadError(false);
    const ok = await downloadPrintFile(
      design,
      `${order.number}-${String(index + 1).padStart(2, "0")}-${side}.png`,
    );
    setDownloading(null);
    if (!ok) setDownloadError(true);
  };

  if (loading) {
    return <p className="py-24 text-center text-sm text-ink-soft">{t.loading}</p>;
  }

  if (failed || !order) {
    return (
      <div className="border border-line p-8 text-center">
        <p className="text-sm text-ink-soft">{t.error}</p>
        <Link href={`/${locale}/admin`} className="mw-btn mw-btn-solid mt-6">
          {t.backToOrders}
        </Link>
      </div>
    );
  }

  const placed = new Date(order.createdAt).toLocaleString(
    locale === "ar" ? "ar-DZ" : "en-GB",
    { dateStyle: "medium", timeStyle: "short" },
  );

  // Only the current status and the moves the workflow allows.
  const statusOptions: OrderStatus[] = [order.status, ...allowedNextStatuses(order.status)];
  const statusOpen = isOpen(order.status);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
        <div>
          <Link
            href={`/${locale}/admin`}
            className="text-[10px] uppercase tracking-[0.18em] text-ink-soft hover:text-ink"
          >
            ← {t.backToOrders}
          </Link>
          <p className="mt-2 font-display text-3xl tracking-tight" dir="ltr">
            {order.number}
          </p>
          <p className="mt-1 text-[11px] text-ink-soft">
            {placed} · {locale === "ar" ? "اللغة" : "Locale"}: {order.locale.toUpperCase()}
          </p>
        </div>
        <StatusPill status={order.status} dict={dict} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <section className="border border-line p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.customer}</p>
            <div className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
              <div>
                <p className="font-semibold">{order.customer.name}</p>
                <a
                  href={`tel:${order.customer.phone}`}
                  className="mt-0.5 block tabular-nums text-ink-soft hover:text-ink"
                  dir="ltr"
                >
                  {order.customer.phone}
                </a>
              </div>
              <div className="leading-relaxed">
                <p className="font-semibold">
                  {locale === "ar" ? order.customer.wilayaAr : order.customer.wilayaEn} ·{" "}
                  {order.customer.commune}
                </p>
                <p className="text-ink-soft">{order.customer.address}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                  {order.customer.delivery === "home" ? dict.checkout.home : dict.checkout.desk}
                </p>
              </div>
            </div>
            {order.customer.notes && (
              <p className="mt-4 border-t border-line pt-3 text-[11px] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">{t.notes}: </span>
                {order.customer.notes}
              </p>
            )}
          </section>

          <section className="mt-6">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.items}</p>
            <ul className="mt-3 space-y-5">
              {order.items.map((item, index) => {
                const sides: Array<{ key: "front" | "back"; label: string; design: OrderDesign }> = [];
                if (item.front) sides.push({ key: "front", label: t.front, design: item.front });
                if (item.back) sides.push({ key: "back", label: t.back, design: item.back });

                return (
                  <li key={`${item.slug}-${index}`} className="border border-line">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-paper-dim px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {locale === "ar" ? item.nameAr : item.nameEn}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-soft">
                          {locale === "ar" ? item.colorNameAr : item.colorNameEn} · {item.size} · ×
                          {item.qty} · {formatPrice(item.unitPrice, locale)}
                        </p>
                      </div>
                      <p className="text-sm font-bold tabular-nums">
                        {formatPrice(item.lineTotal, locale)}
                      </p>
                    </div>

                    {sides.length === 0 ? (
                      <p className="px-4 py-6 text-center text-[11px] text-ink-soft">{t.noDesign}</p>
                    ) : (
                      <div className="grid gap-4 p-4 sm:grid-cols-2">
                        {sides.map((side) => {
                          const designJson = side.design.design;
                          const busyKey = `${index}-${side.key}`;
                          return (
                            <div key={side.key} className="border border-line">
                              <div className="flex items-center justify-between border-b border-line px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.18em] text-ink-soft">
                                  {side.label}
                                </p>
                                <span className="text-[9px] uppercase tracking-[0.12em] text-ink-soft">
                                  30 × 40 cm
                                </span>
                              </div>
                              <div className="flex aspect-[3/4] items-center justify-center bg-stage p-2">
                                {side.design.preview ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={side.design.preview}
                                    alt={`${item.slug} ${side.key}`}
                                    className="h-full w-full object-contain"
                                  />
                                ) : (
                                  <span className="text-[10px] uppercase tracking-[0.12em] text-ink-soft">
                                    {t.download}
                                  </span>
                                )}
                              </div>
                              {designJson ? (
                                <div className="border-t border-line p-3">
                                  <button
                                    type="button"
                                    onClick={() => download(designJson, side.key, index)}
                                    disabled={downloading === busyKey}
                                    className="w-full border border-ink px-3 py-2 text-[10px] uppercase tracking-[0.15em] transition-colors hover:bg-ink hover:text-paper disabled:opacity-50"
                                  >
                                    {downloading === busyKey ? t.downloading : t.download}
                                  </button>
                                  <p className="mt-2 text-[9px] leading-relaxed text-ink-soft">
                                    {t.downloadHint}
                                  </p>
                                </div>
                              ) : (
                                <p className="border-t border-line p-3 text-[9px] text-ink-soft">
                                  {t.noDesign}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-5 lg:sticky lg:top-24">
          <section className="border border-line p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.changeStatus}</p>

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as OrderStatus)}
              disabled={!statusOpen}
              className="mt-3 w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink disabled:opacity-60"
            >
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {dict.status[item]}
                </option>
              ))}
            </select>

            {!statusOpen && (
              <p className="mt-2 text-[10px] leading-relaxed text-ink-soft">{t.statusLocked}</p>
            )}

            <button
              type="button"
              onClick={save}
              disabled={saving || status === order.status || !statusOpen}
              className="mw-btn mw-btn-solid mt-3 w-full disabled:opacity-40"
            >
              {saving ? t.saving : t.save}
            </button>

            {saved && <p className="mt-2 text-[10px] text-green-700">{t.saved}</p>}
            {conflict && <p className="mt-2 text-[10px] text-red-700">{t.invalidTransition}</p>}
            {saveError && <p className="mt-2 text-[10px] text-red-700">{t.saveError}</p>}
            {downloadError && <p className="mt-2 text-[10px] text-red-700">{t.downloadError}</p>}
          </section>

          {(order.statusHistory?.length ?? 0) > 0 && (
            <section className="border border-line p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.history}</p>
              <ol className="mt-3 space-y-2 text-[11px]">
                {order.statusHistory!.map((entry, index) => (
                  <li
                    key={`${entry.at}-${index}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2 last:border-0 last:pb-0"
                  >
                    <span className="font-semibold">{dict.status[entry.to]}</span>
                    <span className="tabular-nums text-[10px] text-ink-soft">
                      {new Date(entry.at).toLocaleString(locale === "ar" ? "ar-DZ" : "en-GB", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section className="border border-line p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.total}</p>
            <dl className="mt-3 space-y-2 text-[12px]">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal, locale)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-soft">{dict.cart.shipping}</dt>
                <dd className="tabular-nums">{formatPrice(order.deliveryFee, locale)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t border-line pt-2 text-base font-bold">
                <dt>{dict.cart.total}</dt>
                <dd className="tabular-nums">{formatPrice(order.total, locale)}</dd>
              </div>
            </dl>
          </section>

          <section className="border border-line bg-paper-dim p-4 text-[10px] leading-relaxed text-ink-soft">
            {dict.checkout.cod}
            <span className="mt-1 block">{order.customer.delivery === "home" ? dict.checkout.homeNote : dict.checkout.deskNote}</span>
          </section>
        </aside>
      </div>
    </div>
  );
}
