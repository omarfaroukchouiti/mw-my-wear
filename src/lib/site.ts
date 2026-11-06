/**
 * Public business details shown on the storefront.
 *
 * These are the shop's real accounts. Change a handle here and the header,
 * footer and structured data update — nothing else hard-codes them.
 */
export const site: {
  /** Shown in the footer and used for the Gmail compose link. */
  email: string;
  /**
   * Official MW logo. The supplied SVG is a light mark, so the UI renders it
   * on an ink plate; the text lock-up is only a fallback when this is null.
   */
  logo: string | null;
  /**
   * Instagram, TikTok and Facebook. Placeholder `#` links are excluded from
   * structured data, so only real profiles are published in `sameAs`.
   */
  social: readonly { label: string; href: string }[];
} = {
  email: "mywear.official@gmail.com",
  logo: "/mw-logo.svg",
  social: [
    { label: "Instagram", href: "https://www.instagram.com/mywear.design" },
    { label: "TikTok", href: "https://www.tiktok.com/@mywear.design" },
    { label: "Facebook", href: "https://www.facebook.com/people/MyWear-MW/61596388254225/" },
  ],
};

const PRODUCTION_FALLBACK = "https://mw-my-wear.vercel.app";
const DEVELOPMENT_FALLBACK = "http://localhost:3000";

/**
 * One absolute origin for canonical links, hreflang, Open Graph and the
 * sitemap. This is the only place the public URL is resolved.
 *
 * Order:
 *   1. NEXT_PUBLIC_SITE_URL  — set it in Vercel (and locally when needed).
 *   2. SITE_URL              — kept for existing deployments.
 *   3. VERCEL_PROJECT_PRODUCTION_URL — Vercel provides it without a scheme.
 *   4. Production fallback, then the local dev server.
 */
export function siteUrl(): string {
  for (const raw of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ]) {
    const value = normalizeSiteUrl(raw);
    if (value) return value;
  }

  return process.env.NODE_ENV === "production"
    ? PRODUCTION_FALLBACK
    : DEVELOPMENT_FALLBACK;
}

function normalizeSiteUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  // Vercel exposes the host without a scheme; localhost must stay on http.
  const withScheme = /^https?:\/\//i.test(value)
    ? value
    : /^localhost(?::\d+)?$/i.test(value)
      ? `http://${value}`
      : `https://${value}`;

  try {
    return new URL(withScheme).origin;
  } catch {
    return null;
  }
}

/**
 * Gmail compose in a new tab. Using the web compose URL (instead of `mailto:`)
 * opens the message window directly for visitors whose browser is not wired to
 * a desktop mail client.
 */
export function gmailComposeUrl(email: string = site.email): string {
  return `https://mail.google.com/mail/?view=cm&to=${email}`;
}
