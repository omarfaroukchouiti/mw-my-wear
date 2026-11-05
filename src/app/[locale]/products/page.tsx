import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { getDictionary, isLocale } from "@/lib/i18n";
import {
  garmentCollections,
  garmentTypes,
  isGarmentType,
  products,
} from "@/lib/products";
import { alternatesFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.products.title} — MW`,
    description: dict.products.subtitle,
    alternates: alternatesFor(locale, "products"),
  };
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { type } = await searchParams;
  const activeType = isGarmentType(type) ? type : null;
  const shown = activeType
    ? products.filter((product) => product.type === activeType)
    : products;

  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-8">
        <div>
          <h1 className="mw-display text-3xl md:text-5xl">{dict.products.title}</h1>
          <p className="mt-3 max-w-md text-sm text-ink-soft">{dict.products.subtitle}</p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
          {String(shown.length).padStart(2, "0")} {dict.products.count}
        </p>
      </div>

      <div
        className="mw-no-scrollbar -mx-1 mt-6 flex gap-2 overflow-x-auto px-1 pb-1"
        aria-label={dict.products.filter}
        role="group"
      >
        <Link
          href={`/${locale}/products`}
          aria-current={!activeType ? "page" : undefined}
          className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors ${
            !activeType
              ? "border-ink bg-ink text-paper"
              : "border-line text-ink-soft hover:border-ink hover:text-ink"
          }`}
        >
          {dict.products.all}
        </Link>

        {garmentTypes.map((item) => (
          <Link
            key={item}
            href={`/${locale}/products?type=${item}`}
            aria-current={activeType === item ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-semibold transition-colors ${
              activeType === item
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-soft hover:border-ink hover:text-ink"
            }`}
          >
            {garmentCollections[item][locale]}
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="py-20 text-sm text-ink-soft">{dict.products.empty}</p>
      ) : (
        <div className="mt-10 grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((product) => (
            <ProductCard key={product.slug} product={product} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
