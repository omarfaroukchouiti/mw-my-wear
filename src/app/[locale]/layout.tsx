import type { Metadata } from "next";
import { Anton, Cairo } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import "../globals.css";

import { CartProvider } from "@/components/cart";
import { AnnouncementBar } from "@/components/announcement-bar";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/structured-data";
import {
  defaultLocale,
  dirOf,
  getDictionary,
  isLocale,
  locales,
  type Locale,
} from "@/lib/i18n";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { site } from "@/lib/site";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const safeLocale: Locale = isLocale(locale) ? locale : defaultLocale;
  const dict = getDictionary(safeLocale);

  return {
    metadataBase: new URL(siteUrl()),
    title: dict.meta.title,
    description: dict.meta.description,
    applicationName: "MW — My Wear",
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale: safeLocale === "ar" ? "ar_DZ" : "en_DZ",
      type: "website",
      url: `/${safeLocale}`,
      siteName: "MW — My Wear",
      images: [
        {
          url: "/og.png",
          width: 1200,
          height: 630,
          alt: "MW — My Wear",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
      images: ["/og.png"],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  const organisation = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "@id": `${siteUrl()}/#store`,
    name: "MW — My Wear",
    url: siteUrl(),
    email: site.email,
    logo: absoluteUrl("/og.png"),
    image: absoluteUrl("/og.png"),
    sameAs: site.social
      .map((item) => item.href)
      .filter((href) => href.startsWith("http")),
    currenciesAccepted: "DZD",
    paymentAccepted: "Cash",
    areaServed: { "@type": "Country", name: "Algeria" },
    knowsLanguage: ["ar", "en"],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: "MW — My Wear",
    url: siteUrl(),
    inLanguage: locale === "ar" ? "ar-DZ" : "en-DZ",
    publisher: { "@id": `${siteUrl()}/#store` },
  };

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${cairo.variable} ${anton.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        {/*
          Applies the saved theme (or the OS preference on a first visit)
          synchronously before the first paint. `beforeInteractive` is the
          supported way to run this in the root layout; Next injects it into
          <head> and runs it once per document load.
        */}
        <Script
          id="mw-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var t="light";try{var s=localStorage.getItem("mw-theme");t=s==="dark"||s==="light"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");}catch(e){try{t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}catch(e2){}}var r=document.documentElement;r.dataset.theme=t;r.style.colorScheme=t;})();',
          }}
        />
        <JsonLd data={[organisation, website]} />
        <CartProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-xs focus:font-semibold focus:text-paper"
          >
            {dict.nav.skip}
          </a>
          <AnnouncementBar text={dict.home.announcement} />
          <Header locale={locale} nav={dict.nav} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer locale={locale} dict={dict} />
        </CartProvider>
      </body>
    </html>
  );
}
