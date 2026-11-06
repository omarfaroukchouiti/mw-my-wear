import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { sizeChart } from "@/lib/sizes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "sizes",
    title: dict.seo.sizes.title,
    description: dict.seo.sizes.description,
  });
}

export default async function SizesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const t = dict.sizes;
  const other = getDictionary(locale === "ar" ? "en" : "ar");

  const columns = [
    { primary: t.size, secondary: other.sizes.size },
    { primary: t.weight, secondary: other.sizes.weight },
    { primary: t.height, secondary: other.sizes.height },
  ];

  return (
    <div className="mw-container py-10 md:py-16">
      <div className="max-w-xl border-b border-line pb-8">
        <p className="mw-eyebrow">{t.eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-5xl">{t.title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{t.subtitle}</p>
      </div>

      <div className="mt-8 max-w-xl">
        <table className="w-full border-collapse border border-line text-sm">
          <thead>
            <tr className="bg-ink text-paper">
              {columns.map((column) => (
                <th key={column.primary} scope="col" className="px-3 py-3 text-center">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.18em]">
                    {column.primary}
                  </span>
                  <span className="mt-1 block text-[8px] uppercase tracking-[0.22em] text-paper/55">
                    {column.secondary}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeChart.map((row) => (
              <tr key={row.size} className="border-t border-line">
                <th scope="row" className="px-3 py-3.5 text-center font-bold">
                  {row.size}
                </th>
                <td className="px-3 py-3.5 text-center tabular-nums text-ink-soft">
                  {row.weight}
                </td>
                <td className="px-3 py-3.5 text-center tabular-nums text-ink-soft">
                  {row.height}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-ink-soft">{t.unit}</p>
        <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">{t.note}</p>
      </div>

      <div className="mt-10">
        <Link href={`/${locale}/products`} className="mw-btn mw-btn-solid">
          {t.cta}
        </Link>
      </div>
    </div>
  );
}
