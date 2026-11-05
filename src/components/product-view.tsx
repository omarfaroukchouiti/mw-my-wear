"use client";

import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/components/cart";
import { Garment } from "@/components/garment";
import type { Dictionary, Locale } from "@/lib/i18n";
import { formatPrice, type Product } from "@/lib/products";

function sizeLabel(size: string, locale: Locale): string {
  if (size !== "ONE") return size;
  return locale === "ar" ? "مقاس واحد" : "One size";
}

export function ProductView({
  product,
  locale,
  dict,
}: {
  product: Product;
  locale: Locale;
  dict: Dictionary;
}) {
  const { add } = useCart();
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const color = product.colors[colorIndex];

  function handleAdd() {
    add({
      slug: product.slug,
      type: product.type,
      colorHex: color.hex,
      colorNameAr: color.name.ar,
      colorNameEn: color.name.en,
      size,
      price: product.price,
      qty,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="relative aspect-4/5 overflow-hidden border border-line bg-stage">
          <Garment
            type={product.type}
            color={color.hex}
            className="h-full w-full p-8 md:p-14"
          />
          <span className="absolute start-3 top-3 bg-paper/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-soft">
            MW / {product.slug}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          {product.colors.map((item, index) => (
            <button
              key={item.hex}
              type="button"
              onClick={() => setColorIndex(index)}
              aria-label={item.name[locale]}
              aria-pressed={index === colorIndex}
              className={`h-12 w-12 border p-1 transition-colors ${
                index === colorIndex ? "border-ink" : "border-line hover:border-ink/40"
              }`}
            >
              <span
                className="block h-full w-full"
                style={{ backgroundColor: item.hex }}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Link
          href={`/${locale}/products`}
          className="text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink"
        >
          ← {dict.product.back}
        </Link>

        <h1 className="mt-5 text-3xl font-black leading-tight md:text-4xl">
          {product.name[locale]}
        </h1>
        <p className="mt-3 text-lg tabular-nums text-ink-soft">
          {formatPrice(product.price, locale)}
        </p>

        <p className="mt-6 text-sm leading-relaxed text-ink-soft">{product.blurb[locale]}</p>

        <div className="mt-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
            {dict.product.color} — <span className="text-ink">{color.name[locale]}</span>
          </p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {dict.product.size}
            </p>
            <Link
              href={`/${locale}/sizes`}
              className="border-b border-line pb-0.5 text-[10px] uppercase tracking-[0.15em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              {dict.product.sizeGuide}
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.sizes.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSize(item)}
                aria-pressed={size === item}
                className={`min-w-12 border px-3 py-2 text-xs font-semibold transition-colors ${
                  size === item
                    ? "border-ink bg-ink text-paper"
                    : "border-line hover:border-ink"
                }`}
              >
                {sizeLabel(item, locale)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <div className="flex items-center border border-line">
            <button
              type="button"
              onClick={() => setQty((value) => Math.max(1, value - 1))}
              className="h-12 w-11 text-lg transition-colors hover:bg-ink hover:text-paper"
              aria-label="-"
            >
              −
            </button>
            <span className="w-10 text-center text-sm tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((value) => Math.min(20, value + 1))}
              className="h-12 w-11 text-lg transition-colors hover:bg-ink hover:text-paper"
              aria-label="+"
            >
              +
            </button>
          </div>

          <button type="button" onClick={handleAdd} className="mw-btn mw-btn-solid flex-1">
            {added ? dict.product.added : dict.product.add}
          </button>
        </div>

        <Link
          href={`/${locale}/studio?p=${product.slug}`}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-line px-4 py-4 text-[11px] font-bold uppercase tracking-[0.15em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
        >
          {dict.product.customize}
          <span aria-hidden="true">✳</span>
        </Link>

        <div className="mt-10 space-y-6 border-t border-line pt-6">
          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {dict.product.details}
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {product.details[locale].map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true">—</span>
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
              {dict.product.print}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {dict.product.printNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
