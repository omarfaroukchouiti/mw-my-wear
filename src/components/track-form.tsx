"use client";

import { useEffect, useState, type FormEvent } from "react";

import type { Dictionary, Locale } from "@/lib/i18n";
import type { OrderStatus, StoredOrder } from "@/lib/orders";
import { formatPrice } from "@/lib/products";

const LAST_ORDER_KEY = "mw.lastOrder";

const STEPS: OrderStatus[] = ["new", "confirmed", "in_production", "shipped", "delivered"];

export function TrackForm({
  locale,
  dict,
  initialNumber,
}: {
  locale: Locale;
  dict: Dictionary;
  initialNumber?: string;
}) {
  const t = dict.track;
  const [number, setNumber] = useState(initialNumber ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<StoredOrder | null>(null);

  // Fill what we can from the last order placed in this browser. The number
  // arrives in the URL from the success page, but the phone still has to be
  // filled so tracking is one click instead of retyping.
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as StoredOrder;
      if (!saved?.number) return;
      if (!initialNumber) {
        setNumber(saved.number);
        if (saved.customer?.phone) setPhone(saved.customer.phone);
      } else if (saved.number.toUpperCase() === initialNumber.trim().toUpperCase()) {
        if (saved.customer?.phone) setPhone(saved.customer.phone);
      }
    } catch {
      // Ignore corrupt storage.
    }
  }, [initialNumber]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setOrder(null);
    try {
      const query = new URLSearchParams({ phone });
      const response = await fetch(
        `/api/orders/${encodeURIComponent(number.trim().toUpperCase())}?${query.toString()}`,
        { cache: "no-store" },
      );
      if (response.ok) {
        const data = (await response.json()) as { order: StoredOrder };
        setOrder(data.order);
      } else if (response.status === 404) {
        setError(t.notFound);
      } else {
        setError(t.error);
      }
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = order ? STEPS.indexOf(order.status) : -1;
  const placed = order
    ? new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-DZ" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

  return (
    <div className="grid gap-10 lg:grid-cols-[360px_1fr]">
      <form onSubmit={submit} className="h-fit border border-line p-6">
        <div>
          <label
            htmlFor="track-number"
            className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-ink-soft"
          >
            {t.number}
          </label>
          <input
            id="track-number"
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder={t.numberPlaceholder}
            dir="ltr"
            required
            className="w-full border border-line bg-paper px-3 py-2.5 text-sm uppercase outline-none focus:border-ink"
          />
        </div>

        <div className="mt-4">
          <label
            htmlFor="track-phone"
            className="mb-1.5 block text-[10px] uppercase tracking-[0.15em] text-ink-soft"
          >
            {t.phone}
          </label>
          <input
            id="track-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder={dict.checkout.phonePlaceholder}
            dir="ltr"
            required
            className="w-full border border-line bg-paper px-3 py-2.5 text-sm outline-none focus:border-ink"
          />
        </div>

        <button type="submit" disabled={busy} className="mw-btn mw-btn-solid mt-5 w-full disabled:opacity-50">
          {busy ? t.submitting : t.submit}
        </button>

        {error && (
          <p role="alert" className="mt-4 border border-line bg-paper-dim px-3 py-2.5 text-[11px] leading-relaxed text-ink">
            {error}
          </p>
        )}

        <p className="mt-5 border-t border-line pt-4 text-[10px] leading-relaxed text-ink-soft">
          {t.help}
        </p>
      </form>

      <div>
        {!order ? (
          <div className="flex h-full min-h-[240px] items-center justify-center border border-dashed border-line text-[11px] text-ink-soft">
            {t.subtitle}
          </div>
        ) : (
          <div className="border border-line">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line bg-paper-dim px-5 py-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.result}</p>
                <p className="mt-1 font-display text-2xl tracking-tight" dir="ltr">
                  {order.number}
                </p>
              </div>
              <div className="text-end">
                <p className="text-[10px] uppercase tracking-[0.15em] text-ink-soft">
                  {dict.checkout.placedAt}
                </p>
                <p className="mt-1 text-[11px]">{placed}</p>
              </div>
            </div>

            <div className="border-b border-line px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                {t.statusTitle}
              </p>

              {order.status === "cancelled" ? (
                <p className="mt-3 inline-block border border-red-600 px-3 py-1.5 text-[11px] font-semibold text-red-700">
                  {dict.status.cancelled}
                </p>
              ) : (
                <ol className="mt-4 flex flex-wrap gap-y-4">
                  {STEPS.map((step, index) => {
                    const done = index <= stepIndex;
                    return (
                      <li key={step} className="flex flex-1 items-center gap-2">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center border text-[10px] ${
                            done ? "border-ink bg-ink text-paper" : "border-line text-ink-soft"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span
                          className={`text-[10px] leading-tight ${
                            done ? "font-semibold text-ink" : "text-ink-soft"
                          }`}
                        >
                          {dict.status[step]}
                        </span>
                        {index < STEPS.length - 1 && (
                          <span
                            aria-hidden
                            className={`mx-1 hidden h-px flex-1 sm:block ${
                              index < stepIndex ? "bg-ink" : "bg-line"
                            }`}
                          />
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <ul className="divide-y divide-line px-5">
              {order.items.map((item, index) => {
                const preview = item.front?.preview ?? item.back?.preview;
                return (
                  <li key={`${item.slug}-${index}`} className="flex gap-4 py-4">
                    <div className="flex h-16 w-14 shrink-0 items-center justify-center border border-line bg-stage">
                      {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview} alt="" className="h-full w-full object-contain p-0.5" />
                      ) : (
                        <span className="text-[9px] uppercase tracking-[0.1em] text-ink-soft">
                          {item.type}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-1 items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold">
                          {locale === "ar" ? item.nameAr : item.nameEn}
                        </p>
                        <p className="mt-1 text-[10px] text-ink-soft">
                          {locale === "ar" ? item.colorNameAr : item.colorNameEn} · {item.size} · ×
                          {item.qty}
                        </p>
                      </div>
                      <p className="text-[11px] tabular-nums">
                        {formatPrice(item.lineTotal, locale)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="grid gap-5 border-t border-line px-5 py-5 sm:grid-cols-2">
              <div className="text-[11px] leading-relaxed text-ink-soft">
                <p className="text-[10px] uppercase tracking-[0.15em]">
                  {dict.checkout.deliveryTo}
                </p>
                <p className="mt-1 text-ink">
                  {order.customer.name} · {order.customer.phone}
                </p>
                <p>
                  {order.customer.address}, {order.customer.commune},{" "}
                  {locale === "ar" ? order.customer.wilayaAr : order.customer.wilayaEn}
                </p>
                <p>{order.customer.delivery === "home" ? dict.checkout.home : dict.checkout.desk}</p>
                {order.customer.notes && (
                  <p className="mt-2 border-t border-line pt-2">{order.customer.notes}</p>
                )}
              </div>

              <dl className="space-y-2 text-[11px] sm:text-end">
                <div className="flex justify-between gap-4 sm:justify-end">
                  <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
                  <dd className="tabular-nums">{formatPrice(order.subtotal, locale)}</dd>
                </div>
                <div className="flex justify-between gap-4 sm:justify-end">
                  <dt className="text-ink-soft">{dict.cart.shipping}</dt>
                  <dd className="tabular-nums">{formatPrice(order.deliveryFee, locale)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-2 text-sm font-bold sm:justify-end">
                  <dt>{dict.cart.total}</dt>
                  <dd className="tabular-nums">{formatPrice(order.total, locale)}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
