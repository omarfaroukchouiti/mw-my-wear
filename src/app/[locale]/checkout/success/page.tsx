import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderSuccess } from "@/components/order-success";
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
    title: `${dict.checkout.successTitle} — MW`,
    robots: { index: false, follow: false },
  };
}

export default async function CheckoutSuccessPage({
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
        <p className="mw-eyebrow">{dict.checkout.cod}</p>
        <h1 className="mt-2 text-2xl font-black md:text-4xl">{dict.checkout.successTitle}</h1>
      </div>

      <div className="mt-8">
        <OrderSuccess locale={locale} dict={dict} />
      </div>
    </div>
  );
}
