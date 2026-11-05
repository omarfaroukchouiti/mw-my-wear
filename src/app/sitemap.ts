import type { MetadataRoute } from "next";

import { products } from "@/lib/products";
import { siteUrl } from "@/lib/seo";

type Entry = {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
};

const pages: Entry[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "products", priority: 0.9, changeFrequency: "weekly" },
  { path: "studio", priority: 0.8, changeFrequency: "monthly" },
  { path: "sizes", priority: 0.6, changeFrequency: "monthly" },
  { path: "faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "shipping", priority: 0.5, changeFrequency: "yearly" },
  { path: "privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "terms", priority: 0.3, changeFrequency: "yearly" },
];

/**
 * Both languages are listed, each with hreflang alternates. Cart, checkout,
 * tracking and the admin dashboard are deliberately absent: they are private
 * or empty shells that must not be indexed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const lastModified = new Date();
  const locales = ["ar", "en"] as const;

  const entries: MetadataRoute.Sitemap = [];

  const add = (path: string, priority: number, changeFrequency: Entry["changeFrequency"]) => {
    const suffix = path ? `/${path}` : "";
    for (const locale of locales) {
      entries.push({
        url: `${base}/${locale}${suffix}`,
        lastModified,
        changeFrequency,
        priority,
        alternates: {
          languages: {
            ar: `${base}/ar${suffix}`,
            en: `${base}/en${suffix}`,
          },
        },
      });
    }
  };

  for (const page of pages) add(page.path, page.priority, page.changeFrequency);
  for (const product of products) {
    add(`products/${product.slug}`, 0.7, "monthly");
  }

  return entries;
}
