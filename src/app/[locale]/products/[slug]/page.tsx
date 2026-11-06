import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductCard } from "@/components/product-card";
import { ProductView } from "@/components/product-view";
import { JsonLd } from "@/components/structured-data";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getProduct, getProductSlugs, products } from "@/lib/products";
import { absoluteUrl, alternatesFor, openGraphFor } from "@/lib/seo";

export function generateStaticParams() {
  return getProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = getProduct(slug);
  if (!product || !isLocale(locale)) return {};
  const title = `${product.name[locale]} — MW`;
  return {
    title,
    description: product.blurb[locale],
    alternates: alternatesFor(locale, `products/${product.slug}`),
    openGraph: openGraphFor(locale, title, product.blurb[locale], `products/${product.slug}`),
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  const product = getProduct(slug);
  if (!product) notFound();

  const dict = getDictionary(locale);
  const related = products
    .filter((item) => item.slug !== product.slug)
    .slice(0, 3);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name[locale],
    description: product.blurb[locale],
    sku: product.slug,
    image: [absoluteUrl("/og.png")],
    brand: { "@type": "Brand", name: "MW — My Wear" },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/${locale}/products/${product.slug}`),
      priceCurrency: "DZD",
      price: product.price,
      // Every piece is made after the order is confirmed, so PreOrder is the
      // honest state until the inventory phase adds real stock counts.
      availability: "https://schema.org/PreOrder",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.nav.shop,
        item: absoluteUrl(`/${locale}/products`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.name[locale],
        item: absoluteUrl(`/${locale}/products/${product.slug}`),
      },
    ],
  };

  return (
    <div className="pb-24 md:pb-16">
      <JsonLd data={[productLd, breadcrumbLd]} />
      <ProductView product={product} locale={locale} dict={dict} />

      <section className="mw-container mt-10 md:mt-16" aria-labelledby="related-heading">
        <div className="flex items-end justify-between gap-4 border-b border-line pb-4">
          <h2 id="related-heading" className="text-lg font-black md:text-2xl">
            {dict.product.related}
          </h2>
          <Link
            href={`/${locale}/products`}
            className="text-[11px] font-semibold text-ink-soft transition-colors hover:text-ink"
          >
            {dict.nav.shop} ←
          </Link>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-5">
          {related.map((item) => (
            <ProductCard key={item.slug} product={item} locale={locale} />
          ))}
        </div>
      </section>
    </div>
  );
}
