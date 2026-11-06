import type { Metadata } from "next";

import type { Locale } from "./i18n";
import { siteUrl } from "./site";

/**
 * Canonical, hreflang and sitemap URLs need one absolute origin. `siteUrl`
 * lives in `site.ts` so the storefront URL is defined exactly once.
 */
export { siteUrl };

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Canonical for the current locale plus hreflang links for both languages.
 * `path` is the part that follows the locale, without slashes: "" for the
 * home page, "products", "products/essential-tee", "sizes"…
 *
 * Query parameters are deliberately ignored so `/products?type=tee` keeps
 * `/products` as its canonical.
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
  image = "/og.png",
): NonNullable<Metadata["openGraph"]> {
  const clean = path.replace(/^\/+|\/+$/g, "");
  return {
    title,
    description,
    url: absoluteUrl(clean ? `/${locale}/${clean}` : `/${locale}`),
    siteName: "MW — My Wear",
    locale: locale === "ar" ? "ar_DZ" : "en_US",
    type: "website",
    images: [
      {
        url: absoluteUrl(image),
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  };
}

/** Twitter cards mirror the page's own Open Graph data, never the home page's. */
export function twitterFor(
  title: string,
  description: string,
  image = "/og.png",
): NonNullable<Metadata["twitter"]> {
  return {
    card: "summary_large_image",
    title,
    description,
    images: [absoluteUrl(image)],
  };
}

type PageMetadata = {
  locale: Locale;
  /** Path after the locale, without slashes. Empty for the home page. */
  path?: string;
  title: string;
  description: string;
  image?: string;
  robots?: Metadata["robots"];
};

/**
 * Complete metadata for one public page. Using a single helper keeps
 * canonical, hreflang, Open Graph and Twitter from drifting apart page to page.
 */
export function pageMetadata({
  locale,
  path = "",
  title,
  description,
  image = "/og.png",
  robots,
}: PageMetadata): Metadata {
  return {
    title,
    description,
    alternates: alternatesFor(locale, path),
    openGraph: openGraphFor(locale, title, description, path, image),
    twitter: twitterFor(title, description, image),
    ...(robots ? { robots } : {}),
  };
}
