import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CartView } from "@/components/cart-view";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.cart.title} — MW`,
    robots: { index: false, follow: true },
  };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-12 md:py-16">
      <h1 className="border-b border-line pb-6 text-3xl font-black md:text-5xl">
        {dict.cart.title}
      </h1>
      <div className="mt-8">
        <CartView locale={locale} dict={dict} />
      </div>
    </div>
  );
}
