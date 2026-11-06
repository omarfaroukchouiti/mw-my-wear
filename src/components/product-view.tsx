"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCart } from "@/components/cart";
import { Garment } from "@/components/garment";
import {
  PaletteIcon,
  RefreshIcon,
  TruckIcon,
  WalletIcon,
} from "@/components/icons";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  formatPrice,
  type GarmentType,
  type Product,
} from "@/lib/products";

function sizeLabel(size: string, locale: Locale): string {
  if (size !== "ONE") return size;
  return locale === "ar" ? "مقاس واحد" : "One size";
}

/** Print window shown on the technical slide, as a share of the stage. */
const PRINT_AREA: Record<
  GarmentType,
  { left: number; top: number; width: number; height: number }
> = {
  tee: { left: 33, top: 34, width: 34, height: 39 },
  oversized: { left: 31, top: 33, width: 38, height: 43 },
  hoodie: { left: 34, top: 47, width: 32, height: 36 },
  sweatshirt: { left: 33, top: 36, width: 34, height: 39 },
  cap: { left: 41.5, top: 36, width: 17, height: 19 },
};

type SlideKey = "front" | "back" | "print";

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
  const router = useRouter();
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sticky, setSticky] = useState(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const actionsRef = useRef<HTMLDivElement>(null);

  const color = product.colors[colorIndex];
  const price = formatPrice(product.price, locale);
  const singleSize = product.sizes.length === 1;

  const slides: Array<{ key: SlideKey; label: string }> = [
    { key: "front", label: dict.product.viewFront },
    { key: "back", label: dict.product.viewBack },
    { key: "print", label: dict.product.viewPrint },
  ];

  const printArea = PRINT_AREA[product.type];

  function cartLine() {
    return {
      slug: product.slug,
      type: product.type,
      colorHex: color.hex,
      colorNameAr: color.name.ar,
      colorNameEn: color.name.en,
      size,
      price: product.price,
      qty,
    };
  }

  function handleAdd() {
    add(cartLine());
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    add(cartLine());
    router.push(`/${locale}/checkout`);
  }

  function handleGalleryScroll() {
    const container = galleryRef.current;
    if (!container) return;

    const box = container.getBoundingClientRect();
    const center = box.left + box.width / 2;
    let next = 0;
    let closest = Number.POSITIVE_INFINITY;

    slideRefs.current.forEach((node, index) => {
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < closest) {
        closest = distance;
        next = index;
      }
    });

    setActiveSlide((current) => (current === next ? current : next));
  }

  function goToSlide(index: number) {
    const slide = slideRefs.current[index];
    if (!slide) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    slide.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  // The sticky bar only shows once the main buy row has scrolled off the top.
  useEffect(() => {
    const node = actionsRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="lg:mx-auto lg:max-w-[85rem] lg:px-10 lg:pt-8 xl:px-12">
        <div className="lg:grid lg:grid-cols-[1.02fr_0.98fr] lg:items-start lg:gap-12 xl:gap-20">
          {/* Gallery ---------------------------------------------------- */}
          <div className="lg:sticky lg:top-24">
            <div className="relative bg-stage lg:overflow-hidden lg:rounded-2xl">
              <div
                ref={galleryRef}
                onScroll={handleGalleryScroll}
                role="group"
                aria-roledescription="carousel"
                aria-label={dict.product.gallery}
                className="mw-no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
              >
                {slides.map((slide, index) => (
                  <div
                    key={slide.key}
                    ref={(node) => {
                      slideRefs.current[index] = node;
                    }}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} / ${slides.length} — ${slide.label}`}
                    className="relative w-full shrink-0 snap-center"
                  >
                    <div className="relative aspect-[5/6] w-full sm:aspect-[4/3] lg:aspect-4/5">
                      <Garment
                        type={product.type}
                        color={color.hex}
                        side={slide.key === "back" ? "back" : "front"}
                        className="h-full w-full p-7 md:p-12"
                      />

                      {slide.key === "print" && (
                        <div
                          className="pointer-events-none absolute flex items-center justify-center border border-dashed border-ink/60"
                          style={{
                            left: `${printArea.left}%`,
                            top: `${printArea.top}%`,
                            width: `${printArea.width}%`,
                            height: `${printArea.height}%`,
                          }}
                        >
                          <span className="bg-paper/85 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-ink-soft">
                            30 × 40
                          </span>
                        </div>
                      )}
                    </div>

                    <span className="absolute bottom-3 start-3 rounded-full bg-paper/85 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-ink-soft backdrop-blur-sm">
                      {slide.label}
                    </span>
                  </div>
                ))}
              </div>

              <span className="pointer-events-none absolute start-3 top-3 bg-paper/80 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-ink-soft">
                MW / {product.slug}
              </span>
            </div>

            <div className="flex items-center justify-center py-1">
              {slides.map((slide, index) => (
                <button
                  key={slide.key}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`${slide.label} — ${index + 1}/${slides.length}`}
                  aria-current={activeSlide === index ? "true" : undefined}
                  className="group flex h-11 w-11 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      activeSlide === index
                        ? "h-2 w-6 bg-ink"
                        : "h-2 w-2 bg-ink/30 group-hover:bg-ink/60"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Details ---------------------------------------------------- */}
          <div className="mx-auto max-w-2xl px-5 pt-4 md:px-10 md:pt-6 lg:mx-0 lg:max-w-none lg:px-0 lg:pt-0">
            <Link
              href={`/${locale}/products`}
              className="hidden text-[10px] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-ink lg:inline-block"
            >
              ← {dict.product.back}
            </Link>

            <h1 className="mt-3 text-[26px] font-black leading-tight md:text-4xl">
              {product.name[locale]}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-2xl font-black tabular-nums md:text-[28px]">{price}</p>
              {product.compareAt ? (
                <p className="text-sm tabular-nums text-ink-soft line-through">
                  {formatPrice(product.compareAt, locale)}
                </p>
              ) : null}
            </div>

            {/* Colour */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                  {dict.product.color}
                </p>
                <p className="text-xs font-semibold">{color.name[locale]}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-0.5">
                {product.colors.map((item, index) => (
                  <button
                    key={item.hex}
                    type="button"
                    onClick={() => setColorIndex(index)}
                    aria-label={item.name[locale]}
                    aria-pressed={index === colorIndex}
                    title={item.name[locale]}
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                  >
                    <span
                      className={`block h-8 w-8 rounded-full border transition ${
                        index === colorIndex
                          ? "border-ink ring-2 ring-ink ring-offset-2 ring-offset-paper"
                          : "border-line hover:border-ink/40"
                      }`}
                      style={{ backgroundColor: item.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="mt-4">
              <div className="flex items-center justify-between gap-3">
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

              {singleSize ? (
                <p className="mt-2 text-sm font-semibold">
                  {sizeLabel(product.sizes[0], locale)}
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {product.sizes.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSize(item)}
                      aria-pressed={size === item}
                      className={`min-h-11 min-w-11 rounded-full border px-3 text-xs font-semibold transition-colors ${
                        size === item
                          ? "border-ink bg-ink text-paper"
                          : "border-line hover:border-ink"
                      }`}
                    >
                      {sizeLabel(item, locale)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
                {dict.product.quantity}
              </p>
              <div className="flex items-center rounded-full border border-line">
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.max(1, value - 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-base transition-colors hover:bg-ink hover:text-paper"
                  aria-label={locale === "ar" ? "تقليل الكمية" : "Decrease quantity"}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => setQty((value) => Math.min(20, value + 1))}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-base transition-colors hover:bg-ink hover:text-paper"
                  aria-label={locale === "ar" ? "زيادة الكمية" : "Increase quantity"}
                >
                  +
                </button>
              </div>
            </div>

            {/* Primary actions */}
            <div ref={actionsRef} className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleBuyNow}
                className="mw-btn mw-btn-solid min-h-12 flex-1 px-3 text-sm"
              >
                {dict.product.buyNow}
              </button>
              <button
                type="button"
                onClick={handleAdd}
                aria-live="polite"
                className="mw-btn mw-btn-ghost min-h-12 flex-1 px-3 text-sm"
              >
                {added ? dict.product.added : dict.product.add}
              </button>
            </div>

            <Link
              href={`/${locale}/studio?p=${product.slug}`}
              className="mt-2.5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-dashed border-ink/40 px-4 py-3 text-[11px] font-bold text-ink-soft transition-colors hover:border-ink hover:text-ink"
            >
              <PaletteIcon size={17} />
              {dict.product.customize}
            </Link>

            {/* Trust lines */}
            <ul className="mt-4 space-y-2 border-t border-line pt-4 text-[12px] text-ink-soft">
              <li className="flex items-center gap-2">
                <TruckIcon size={16} className="shrink-0" />
                <span>{dict.product.trustDelivery}</span>
              </li>
              <li className="flex items-center gap-2">
                <WalletIcon size={16} className="shrink-0" />
                <span>{dict.product.trustCod}</span>
              </li>
              <li className="flex items-center gap-2">
                <RefreshIcon size={16} className="shrink-0" />
                <span>{dict.product.trustExchange}</span>
              </li>
            </ul>

            {/* One collapsible block: description + specs + print note */}
            <details className="mw-details mt-4 border-y border-line">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-sm font-bold">
                <span>{dict.product.descriptionDetails}</span>
                <span
                  aria-hidden="true"
                  className="mw-details-icon flex h-7 w-7 items-center justify-center rounded-full border border-line text-base leading-none"
                >
                  +
                </span>
              </summary>
              <div className="pb-4 text-[13px] leading-relaxed text-ink-soft">
                <p>{product.blurb[locale]}</p>
                <ul className="mt-3 grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {product.details[locale].map((line) => (
                    <li key={line} className="flex gap-2">
                      <span aria-hidden="true">—</span>
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-3">{dict.product.printNote}</p>
              </div>
            </details>
          </div>
        </div>
      </div>

      {/* Mobile sticky purchase bar ---------------------------------- */}
      <div
        aria-hidden={!sticky}
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur-xl transition-[transform,opacity] duration-300 lg:hidden ${
          sticky
            ? "visible translate-y-0 opacity-100"
            : "invisible pointer-events-none translate-y-full opacity-0"
        }`}
      >
        <div className="mw-product-bar flex items-center gap-3 px-4 pt-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] text-ink-soft">
              {product.name[locale]}
            </p>
            <p className="text-base font-black tabular-nums">{price}</p>
          </div>
          <button
            type="button"
            onClick={handleBuyNow}
            className="mw-btn mw-btn-solid min-h-12 shrink-0 px-6 text-sm"
          >
            {dict.product.buyNow}
          </button>
        </div>
      </div>
    </>
  );
}
