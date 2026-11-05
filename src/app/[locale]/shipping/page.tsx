import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalPage } from "@/components/legal-page";
import { getDictionary, isLocale } from "@/lib/i18n";
import { alternatesFor, openGraphFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.shipping.title} — MW`,
    description: dict.shipping.intro,
    alternates: alternatesFor(locale, "shipping"),
    openGraph: openGraphFor(locale, `${dict.shipping.title} — MW`, dict.shipping.intro, "shipping"),
  };
}

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const t = dict.shipping;

  return (
    <LegalPage
      locale={locale}
      dict={dict}
      eyebrow={t.eyebrow}
      title={t.title}
      intro={t.intro}
      sections={t.sections}
    />
  );
}
