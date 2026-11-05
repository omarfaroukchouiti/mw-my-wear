import Link from "next/link";

import type { Dictionary, Locale } from "@/lib/i18n";
import { gmailComposeUrl, site } from "@/lib/site";

export type LegalSection = { title: string; paragraphs: string[] };

/**
 * Shared layout for the policy pages (privacy, terms, shipping). Keeping the
 * chrome here means a new policy page only supplies its translated copy.
 */
export function LegalPage({
  locale,
  dict,
  eyebrow,
  title,
  intro,
  sections,
}: {
  locale: Locale;
  dict: Dictionary;
  eyebrow: string;
  title: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <div className="mw-container py-10 md:py-16">
      <div className="max-w-3xl">
        <div className="border-b border-line pb-8">
          <p className="mw-eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">{title}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{intro}</p>
          <p className="mt-4 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
            {dict.legal.updated}
          </p>
        </div>

        <article>
          {sections.map((section, index) => (
            <section key={section.title} className="border-b border-line py-7">
              <h2 className="flex items-baseline gap-3 text-lg font-black md:text-xl">
                <span aria-hidden="true" className="font-display text-sm text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {section.title}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </article>

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

        <div className="mt-8">
          <Link
            href={`/${locale}/products`}
            className="border-b border-ink pb-0.5 text-[11px] font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-60"
          >
            {dict.legal.back}
          </Link>
        </div>
      </div>
    </div>
  );
}
