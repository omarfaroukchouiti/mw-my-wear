import Link from "next/link";

import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import type { Dictionary, Locale } from "@/lib/i18n";
import { gmailComposeUrl, site } from "@/lib/site";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = new Date().getFullYear();

  const instagram = site.social.find((item) => item.label === "Instagram");
  const tiktok = site.social.find((item) => item.label === "TikTok");
  const facebook = site.social.find((item) => item.label === "Facebook");

  const channels = [
    ...(instagram
      ? [{ label: instagram.label, href: instagram.href, icon: <InstagramIcon size={18} /> }]
      : []),
    ...(tiktok
      ? [{ label: tiktok.label, href: tiktok.href, icon: <TikTokIcon size={17} /> }]
      : []),
    ...(facebook
      ? [{ label: facebook.label, href: facebook.href, icon: <FacebookIcon size={18} /> }]
      : []),
  ];

  return (
    <footer id="contact" className="border-t border-line bg-paper">
      <div className="mw-container py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr_0.7fr] md:gap-12">
          <div>
            <Logo locale={locale} size="lg" />
            <p className="mt-6 font-display text-[26px] leading-none tracking-tight">
              {dict.footer.tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {dict.footer.taglineNote}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="mw-eyebrow">{dict.footer.explore}</p>
              <ul className="mt-3 space-y-0.5 text-sm">
                <li>
                  <Link href={`/${locale}/products`} className="story-link inline-block py-2">
                    {dict.nav.shop}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/studio`} className="story-link inline-block py-2">
                    {dict.nav.studio}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}#how`} className="story-link inline-block py-2">
                    {dict.nav.how}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}#community`} className="story-link inline-block py-2">
                    {dict.nav.community}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="mw-eyebrow">{dict.footer.help}</p>
              <ul className="mt-3 space-y-0.5 text-sm">
                <li>
                  <Link href={`/${locale}/sizes`} className="story-link inline-block py-2">
                    {dict.footer.sizes}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/shipping`} className="story-link inline-block py-2">
                    {dict.footer.shipping}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/faq`} className="story-link inline-block py-2">
                    {dict.footer.faq}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/track`} className="story-link inline-block py-2">
                    {dict.footer.track}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <p className="mw-eyebrow">{dict.footer.follow}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {channels.map((channel) => {
                const external = channel.href.startsWith("http");
                return (
                  <li key={channel.label}>
                    <a
                      href={channel.href}
                      aria-label={channel.label}
                      title={channel.label}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noopener noreferrer" : undefined}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink-soft transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      {channel.icon}
                    </a>
                  </li>
                );
              })}
            </ul>
            <a
              href={gmailComposeUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block break-all text-[11px] text-ink-soft transition-colors hover:text-ink"
            >
              {site.email}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-line pt-6 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {dict.footer.rights} — MW — My Wear.
          </p>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <li>
              <Link href={`/${locale}/privacy`} className="story-link inline-block py-1.5">
                {dict.footer.privacy}
              </Link>
            </li>
            <li>
              <Link href={`/${locale}/terms`} className="story-link inline-block py-1.5">
                {dict.footer.terms}
              </Link>
            </li>
            <li className="uppercase tracking-[0.14em]">{dict.footer.made}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
