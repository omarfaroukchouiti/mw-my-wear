import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/structured-data";
import { getDictionary, isLocale } from "@/lib/i18n";
import { alternatesFor, openGraphFor } from "@/lib/seo";
import { gmailComposeUrl, site } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return {
    title: `${dict.faq.title} — MW`,
    description: dict.faq.intro,
    alternates: alternatesFor(locale, "faq"),
    openGraph: openGraphFor(locale, `${dict.faq.title} — MW`, dict.faq.intro, "faq"),
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const t = dict.faq;

  const structured = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: t.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const related = [
    { href: `/${locale}/sizes`, label: dict.footer.sizes },
    { href: `/${locale}/shipping`, label: dict.footer.shipping },
    { href: `/${locale}/track`, label: dict.footer.track },
  ];

  return (
    <div className="mw-container py-10 md:py-16">
      <div className="max-w-3xl">
        <div className="border-b border-line pb-8">
          <p className="mw-eyebrow">{t.eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">{t.title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.intro}</p>
        </div>

        <div className="divide-y divide-line border-b border-line">
          {t.items.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 text-sm font-bold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 font-display text-lg leading-none text-ink-soft transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
          {related.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="border-b border-ink pb-0.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-60"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-10 border border-line p-6">
          <h2 className="text-base font-black">{dict.legal.questionsTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{dict.legal.questionsBody}</p>
          <a
            href={gmailComposeUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block border-b border-ink pb-0.5 text-sm font-bold transition-opacity hover:opacity-60"
          >
            {site.email}
          </a>
        </div>
      </div>

      <JsonLd data={structured} />
    </div>
  );
}
