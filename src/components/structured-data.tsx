/**
 * Renders JSON-LD structured data. Server components only.
 *
 * `<` is escaped so a product name or FAQ answer can never close the script
 * tag early. The CSP already allows the inline script this produces (see
 * next.config.ts); the alternative would be a nonce, which conflicts with the
 * static rendering this site relies on for SEO.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
