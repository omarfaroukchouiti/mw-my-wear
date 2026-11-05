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

/**
 * Gmail compose in a new tab. Using the web compose URL (instead of `mailto:`)
 * opens the message window directly for visitors whose browser is not wired to
 * a desktop mail client.
 */
export function gmailComposeUrl(email: string = site.email): string {
  return `https://mail.google.com/mail/?view=cm&to=${email}`;
}
