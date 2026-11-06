import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StudioEditorLoader } from "@/components/studio/studio-editor-loader";
import { getDictionary, isLocale } from "@/lib/i18n";
import { products } from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

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
    path: "studio",
    title: dict.seo.studio.title,
    description: dict.seo.studio.description,
  });
}

export default async function StudioPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { p } = await searchParams;
  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-8 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="mw-eyebrow">{dict.home.studioEyebrow}</p>
          <h1 className="mt-2 text-2xl font-black md:text-4xl">{dict.studio.title}</h1>
          <p className="mt-2 max-w-lg text-[13px] text-ink-soft">{dict.studio.subtitle}</p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">
          {dict.editor.printNote}
        </p>
      </div>

      <div className="mt-6">
        <StudioEditorLoader
          locale={locale}
          dict={dict}
          products={products}
          initialSlug={p}
        />
      </div>
    </div>
  );
}
