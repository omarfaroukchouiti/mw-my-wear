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
    title: `${dict.terms.title} — MW`,
    description: dict.terms.intro,
    alternates: alternatesFor(locale, "terms"),
    openGraph: openGraphFor(locale, `${dict.terms.title} — MW`, dict.terms.intro, "terms"),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const t = dict.terms;

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
