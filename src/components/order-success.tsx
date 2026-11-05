"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { StoredOrder } from "@/lib/orders";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPrice } from "@/lib/products";

const LAST_ORDER_KEY = "mw.lastOrder";

export function OrderSuccess({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [order, setOrder] = useState<StoredOrder | null>(null);
  const [loaded, setLoaded] = useState(false);
  const t = dict.checkout;

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) setOrder(JSON.parse(raw) as StoredOrder);
    } catch {
      setOrder(null);
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <div className="py-24 text-sm text-ink-soft">…</div>;
  }

  if (!order) {
    return (
      <div className="border border-line p-8 text-center">
        <p className="text-sm leading-relaxed text-ink-soft">{t.successMissing}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={`/${locale}/track`} className="mw-btn mw-btn-solid">
            {t.trackCta}
          </Link>
          <Link href={`/${locale}/products`} className="mw-btn mw-btn-ghost border-line">
            {t.successContinue}
          </Link>
        </div>
      </div>
    );
  }

  const placed = new Date(order.createdAt).toLocaleString(locale === "ar" ? "ar-DZ" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="border border-ink p-6 md:p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.orderNumber}</p>
          <p className="mt-2 font-display text-3xl tracking-tight md:text-4xl" dir="ltr">
            {order.number}
          </p>
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-soft">{t.successBody}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`/${locale}/track?number=${order.number}`} className="mw-btn mw-btn-solid">
              {t.trackCta}
            </Link>
            <Link href={`/${locale}/products`} className="mw-btn mw-btn-ghost border-line">
              {t.successContinue}
            </Link>
          </div>
        </div>

        <ul className="mt-8 divide-y divide-line border-y border-line">
          {order.items.map((item, index) => {
            const preview = item.front?.preview ?? item.back?.preview;
            return (
              <li key={`${item.slug}-${index}`} className="flex gap-4 py-4">
                <div className="flex h-20 w-16 shrink-0 items-center justify-center border border-line bg-stage">
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="" className="h-full w-full object-contain p-1" />
                  ) : (
                    <span className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">
                      {item.type}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">{locale === "ar" ? item.nameAr : item.nameEn}</p>
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {locale === "ar" ? item.colorNameAr : item.colorNameEn} · {item.size} · ×
                      {item.qty}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">{formatPrice(item.lineTotal, locale)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="h-fit border border-line p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">{t.summary}</p>
        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
            <dd className="tabular-nums">{formatPrice(order.subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">{dict.cart.shipping}</dt>
            <dd className="tabular-nums">{formatPrice(order.deliveryFee, locale)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2.5 text-base font-bold">
            <dt>{dict.cart.total}</dt>
            <dd className="tabular-nums">{formatPrice(order.total, locale)}</dd>
          </div>
        </dl>

        <div className="mt-5 space-y-3 border-t border-line pt-4 text-[11px] leading-relaxed text-ink-soft">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em]">{t.deliveryTo}</p>
            <p className="mt-1 text-ink">
              {order.customer.name} · {order.customer.phone}
            </p>
            <p>
              {order.customer.address}, {order.customer.commune},{" "}
              {locale === "ar" ? order.customer.wilayaAr : order.customer.wilayaEn}
            </p>
            <p>
              {order.customer.delivery === "home" ? t.home : t.desk}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em]">{t.placedAt}</p>
            <p className="mt-1 text-ink">{placed}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em]">{dict.checkout.cod}</p>
            <p className="mt-1">{dict.checkout.codNote}</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
