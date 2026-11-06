import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TrackForm } from "@/components/track-form";
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
    title: `${dict.track.title} — MW`,
    description: dict.track.subtitle,
    robots: { index: false, follow: false },
  };
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ number?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { number } = await searchParams;
  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-8 md:py-12">
      <div className="max-w-2xl">
        <p className="mw-eyebrow">{dict.footer.help}</p>
        <h1 className="mt-2 text-2xl font-black md:text-4xl">{dict.track.title}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{dict.track.subtitle}</p>
      </div>

      <div className="mt-8">
        <TrackForm locale={locale} dict={dict} initialNumber={number} />
      </div>
    </div>
  );
}
