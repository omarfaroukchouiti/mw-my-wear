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
    title: `${dict.privacy.title} — MW`,
    description: dict.privacy.intro,
    alternates: alternatesFor(locale, "privacy"),
    openGraph: openGraphFor(locale, `${dict.privacy.title} — MW`, dict.privacy.intro, "privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const t = dict.privacy;

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
