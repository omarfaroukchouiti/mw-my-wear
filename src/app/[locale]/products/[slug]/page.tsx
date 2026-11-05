import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductView } from "@/components/product-view";
import { JsonLd } from "@/components/structured-data";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getProduct, getProductSlugs } from "@/lib/products";
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
    <div className="mw-container py-10 md:py-16">
      <JsonLd data={[productLd, breadcrumbLd]} />
      <ProductView product={product} locale={locale} dict={dict} />
    </div>
  );
}
