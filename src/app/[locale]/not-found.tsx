import Link from "next/link";
import { locale } from "next/root-params";

import { getDictionary, isLocale, type Locale } from "@/lib/i18n";

/**
 * Bilingual 404. `not-found.tsx` receives no props, but `app/[locale]` is the
 * root layout, so `next/root-params` exposes the current locale to any server
 * component. That keeps the copy server-rendered instead of relying on a
 * client hook.
 */
export default async function LocaleNotFound() {
  const value = await locale();
  const current: Locale = isLocale(value) ? value : "ar";
  const t = getDictionary(current).notFound;

  return (
    <div className="mw-container flex min-h-[60vh] flex-col justify-center py-16">
      <p className="mw-eyebrow">{t.eyebrow}</p>
      <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{t.title}</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">{t.body}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href={`/${current}`} className="mw-btn mw-btn-solid">
          {t.home}
        </Link>
        <Link href={`/${current}/products`} className="mw-btn mw-btn-ghost">
          {t.shop}
        </Link>
        <Link href={`/${current}/sizes`} className="mw-btn mw-btn-ghost">
          {t.sizes}
        </Link>
      </div>
    </div>
  );
}
