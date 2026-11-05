import type { Metadata } from "next";

import type { Locale } from "./i18n";

/**
 * Canonical, hreflang and sitemap URLs need one absolute origin. `SITE_URL`
 * is the only value the owner must set for production; locally it falls back
 * to the dev server so previews still produce valid absolute URLs.
 */
export function siteUrl(): string {
  const raw = process.env.SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw).origin;
    } catch {
      // Fall through to the local default rather than crashing the site.
    }
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Canonical for the current locale plus hreflang links for both languages.
 * `path` is the part that follows the locale, without slashes: "" for the
 * home page, "products", "products/essential-tee", "sizes"…
 */
export function alternatesFor(locale: Locale, path = ""): Metadata["alternates"] {
  const clean = path.replace(/^\/+|\/+$/g, "");
  const suffix = clean ? `/${clean}` : "";
  return {
    canonical: `/${locale}${suffix}`,
    languages: {
      ar: `/ar${suffix}`,
      en: `/en${suffix}`,
      "x-default": `/ar${suffix}`,
    },
  };
}

/**
 * Open Graph block for pages that define their own metadata. A page-level
 * `openGraph` replaces the layout's object instead of merging into it, so the
 * shared image, locale and type have to be repeated here.
 */
export function openGraphFor(
  locale: Locale,
  title: string,
  description: string,
  path = "",
): NonNullable<Metadata["openGraph"]> {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return {
    title,
    description,
    url: absoluteUrl(clean ? `/${locale}/${clean}` : `/${locale}`),
    siteName: "MW — My Wear",
    locale: locale === "ar" ? "ar_DZ" : "en_DZ",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MW — My Wear" }],
  };
}

