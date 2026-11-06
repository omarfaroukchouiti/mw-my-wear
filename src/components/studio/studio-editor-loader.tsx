"use client";

import dynamic from "next/dynamic";

import type { Dictionary, Locale } from "@/lib/i18n";
import type { Product } from "@/lib/products";

/**
 * The editor is a large client component (fabric objects, history, layer
 * panels). Loading it on demand keeps the studio page's heading and metadata
 * interactive while its JavaScript chunk is fetched.
 */
const StudioEditor = dynamic(
  () => import("./studio-editor").then((module) => module.StudioEditor),
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden="true"
        className="h-[70vh] min-h-[420px] animate-pulse rounded-3xl border border-line bg-stage"
      />
    ),
  },
);

export function StudioEditorLoader({
  locale,
  dict,
  products,
  initialSlug,
}: {
  locale: Locale;
  dict: Dictionary;
  products: Product[];
  initialSlug?: string;
}) {
  return (
    <StudioEditor
      locale={locale}
      dict={dict}
      products={products}
      initialSlug={initialSlug}
    />
  );
}
