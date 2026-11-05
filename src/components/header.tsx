"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useCart } from "@/components/cart";
import {
  ArrowRightIcon,
  BagIcon,
  CloseIcon,
  MenuIcon,
  SearchIcon,
  UserIcon,
} from "@/components/icons";
import { Logo } from "@/components/logo";
import { SearchOverlay } from "@/components/search-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Dictionary, Locale } from "@/lib/i18n";

type HeaderProps = {
  locale: Locale;
  nav: Dictionary["nav"];
};

export function Header({ locale, nav }: HeaderProps) {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const closeSearch = useCallback(() => setSearchOpen(false), []);

  const other: Locale = locale === "ar" ? "en" : "ar";
  const segments = pathname.split("/").filter(Boolean);
  const rest = segments.slice(1).join("/");
  const switchHref = `/${other}${rest ? `/${rest}` : ""}`;

  const links = [
    {
      href: `/${locale}/products`,
      label: nav.shop,
      active: pathname.startsWith(`/${locale}/products`),
    },
    {
      href: `/${locale}/studio`,
      label: nav.studio,
      active: pathname.startsWith(`/${locale}/studio`),
    },
    { href: `/${locale}#how`, label: nav.how, active: false },
    { href: `/${locale}#community`, label: nav.community, active: false },
  ];

  const cartCount = ready ? count : 0;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-paper/90 backdrop-blur-xl">
        <div className="mw-container relative flex h-[68px] items-center justify-between gap-3">
          <Logo locale={locale} />

          <nav
            aria-label={nav.menu}
            className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors ${
                  link.active ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {link.label}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-3 bottom-0.5 h-px origin-center bg-ink transition-transform duration-300 ${
                    link.active ? "scale-x-100" : "scale-x-0"
                  }`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label={nav.search}
              aria-haspopup="dialog"
              className="mw-icon-btn"
            >
              <SearchIcon size={19} />
            </button>

            <ThemeToggle label={nav.theme} />

            <Link
              href={`/${locale}/track`}
              aria-label={nav.account}
              title={nav.account}
              className="mw-icon-btn hidden sm:inline-flex"
            >
              <UserIcon size={19} />
            </Link>

            <Link
              href={`/${locale}/cart`}
              aria-label={`${nav.cart} — ${cartCount}`}
              className="mw-icon-btn relative"
            >
              <BagIcon size={19} />
              <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ink px-1 text-[9px] font-bold tabular-nums text-paper">
                {cartCount}
              </span>
            </Link>

            <Link
              href={switchHref}
              aria-label={nav.langLabel}
              className="ms-1 hidden h-9 items-center rounded-full border border-line px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink md:inline-flex"
            >
              {other === "ar" ? "العربية" : "EN"}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? nav.close : nav.menu}
              className="mw-icon-btn ms-0.5 lg:hidden"
            >
              {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-line bg-paper lg:hidden">
            <nav aria-label={nav.menu} className="mw-container flex flex-col pb-5 pt-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-line py-3.5 text-[15px] font-semibold"
                >
                  {link.label}
                  <ArrowRightIcon size={17} className="text-ink-soft rtl:-scale-x-100" />
                </Link>
              ))}

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href={`/${locale}/track`}
                  onClick={() => setOpen(false)}
                  className="mw-btn mw-btn-ghost"
                >
                  <UserIcon size={16} />
                  {nav.account}
                </Link>
                <Link
                  href={switchHref}
                  onClick={() => setOpen(false)}
                  className="mw-btn mw-btn-ghost"
                >
                  {other === "ar" ? "العربية" : "English"}
                </Link>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearchOpen(true);
                }}
                className="mt-2 flex items-center gap-2 py-2 text-xs font-medium text-ink-soft"
              >
                <SearchIcon size={15} />
                {nav.search}
              </button>
            </nav>
          </div>
        )}
      </header>

      <SearchOverlay
        open={searchOpen}
        onClose={closeSearch}
        locale={locale}
        labels={nav}
      />
    </>
  );
}
