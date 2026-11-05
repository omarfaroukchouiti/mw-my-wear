import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CheckoutForm } from "@/components/checkout-form";
import { wilayas } from "@/lib/algeria";
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
    title: `${dict.checkout.title} — MW`,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-8 md:py-12">
      <div className="max-w-2xl">
        <p className="mw-eyebrow">{dict.cart.checkout}</p>
        <h1 className="mt-2 text-2xl font-black md:text-4xl">{dict.checkout.title}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{dict.checkout.subtitle}</p>
      </div>

      <div className="mt-8">
        <CheckoutForm locale={locale} dict={dict} wilayas={wilayas} />
      </div>
    </div>
  );
}
