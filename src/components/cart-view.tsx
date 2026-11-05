"use client";

import Link from "next/link";

import { useCart } from "@/components/cart";
import { Garment } from "@/components/garment";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPrice, getProduct, type GarmentType } from "@/lib/products";

export function CartView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lines, subtotal, remove, clear, ready } = useCart();

  if (!ready) {
    return <div className="py-24 text-sm text-ink-soft">…</div>;
  }

  if (lines.length === 0) {
    return (
      <div className="border border-line py-20 text-center">
        <p className="text-sm text-ink-soft">{dict.cart.empty}</p>
        <Link href={`/${locale}/products`} className="mw-btn mw-btn-solid mt-6">
          {dict.cart.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_0.6fr]">
      <ul className="divide-y divide-line border-y border-line">
        {lines.map((line) => {
          const product = getProduct(line.slug);
          const name = product ? product.name[locale] : line.slug;
          const preview = line.front?.preview ?? line.back?.preview;
          const twoSides = Boolean(line.front?.preview && line.back?.preview);

          return (
            <li key={line.key} className="flex gap-4 py-5">
              <div className="relative flex h-24 w-20 shrink-0 items-center justify-center border border-line bg-stage">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={preview} alt="" className="h-full w-full object-contain p-1" />
                ) : (
                  <Garment
                    type={line.type as GarmentType}
                    color={line.colorHex}
                    className="h-full w-full p-1.5"
                    mark={false}
                  />
                )}
                {twoSides && (
                  <span className="absolute bottom-0 start-0 bg-ink px-1 py-0.5 text-[8px] uppercase tracking-[0.1em] text-paper">
                    {dict.cart.twoSides}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/${locale}/products/${line.slug}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-soft">
                      {locale === "ar" ? line.colorNameAr : line.colorNameEn} · {line.size} · ×
                      {line.qty}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums">
                    {formatPrice(line.price * line.qty, locale)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.key)}
                  className="self-start text-[10px] uppercase tracking-[0.2em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  {dict.cart.remove}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit border border-line p-6 lg:sticky lg:top-24">
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{dict.cart.subtotal}</dt>
            <dd className="tabular-nums">{formatPrice(subtotal, locale)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">{dict.cart.shipping}</dt>
            <dd className="text-xs text-ink-soft">{dict.cart.shippingNote}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base font-bold">
            <dt>{dict.cart.total}</dt>
            <dd className="tabular-nums">{formatPrice(subtotal, locale)}</dd>
          </div>
        </dl>

        <Link href={`/${locale}/checkout`} className="mw-btn mw-btn-solid mt-6 w-full">
          {dict.cart.checkout}
        </Link>

        <p className="mt-3 text-center text-[10px] uppercase tracking-[0.15em] text-ink-soft">
          {dict.checkout.cod}
        </p>

        <div className="mt-6 flex flex-col gap-3 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
          <Link href={`/${locale}/products`} className="hover:text-ink">
            ← {dict.cart.continue}
          </Link>
          <button type="button" onClick={clear} className="text-start hover:text-ink">
            {dict.cart.clear}
          </button>
        </div>
      </aside>
    </div>
  );
}
