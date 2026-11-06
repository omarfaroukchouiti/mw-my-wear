import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/seo";

/**
 * Public pages only. The admin dashboard, the APIs and the private shopping
 * flow are excluded; they also send `noindex` in their own metadata, because
 * robots.txt only stops crawling, not indexing of a linked URL.
 */
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api",
          "/admin",
          "/ar/admin",
          "/en/admin",
          "/ar/cart",
          "/en/cart",
          "/ar/checkout",
          "/en/checkout",
          "/ar/track",
          "/en/track",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
