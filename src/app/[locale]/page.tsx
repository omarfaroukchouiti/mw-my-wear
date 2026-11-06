import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CommunityCarousel } from "@/components/community-carousel";
import { Garment } from "@/components/garment";
import { HeroTee } from "@/components/hero-tee";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  FeatureIcon,
} from "@/components/icons";
import { StudioVideo } from "@/components/studio-video";
import { getDictionary, isLocale } from "@/lib/i18n";
import {
  formatPrice,
  garmentCollections,
  garmentTypes,
  products,
  type GarmentType,
} from "@/lib/products";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    title: dict.seo.home.title,
    description: dict.seo.home.description,
  });
}

const collectionColor: Record<GarmentType, string> = {
  tee: "#111110",
  oversized: "#EDE8DD",
  hoodie: "#7C7C78",
  sweatshirt: "#D8C7AC",
  cap: "#111110",
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const home = dict.home;

  return (
    <>
      {/* 03 — Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <span className="absolute -start-24 top-24 h-64 w-64 rounded-full border border-line/80" />
          <span className="absolute end-[7%] top-16 hidden h-24 w-24 rounded-full bg-accent-soft md:block" />
          <span className="absolute end-[18%] top-44 hidden h-2.5 w-2.5 rounded-full bg-accent md:block" />
          <span className="absolute end-10 bottom-24 hidden h-16 w-16 rotate-12 rounded-2xl border border-line lg:block" />
          <span className="mw-dot-grid absolute -start-6 bottom-10 hidden h-28 w-40 opacity-70 sm:block" />
        </div>

        <div className="mw-container relative grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div className="mw-rise relative z-10 text-center lg:text-start">
            <p className="mw-eyebrow">{home.heroLabel}</p>

            <h1 className="mw-display mt-5 text-[clamp(2.85rem,8.4vw,5.6rem)]">
              {home.title}
            </h1>

            <p className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-ink-soft lg:mx-0">
              {home.subtitle}
            </p>

            <div className="mw-rise mw-delay-1 mt-8 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href={`/${locale}/studio`}
                className="mw-btn mw-btn-solid group"
              >
                {home.ctaPrimary}
                <ArrowRightIcon
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
                />
              </Link>
              <Link
                href={`/${locale}/products`}
                className="mw-btn mw-btn-ghost"
              >
                {home.ctaSecondary}
              </Link>
            </div>

            <div className="mw-rise mw-delay-2 mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft lg:justify-start">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {home.heroPiece}
              </span>
              <span className="hidden h-3 w-px bg-line sm:block" />
              <span>{home.heroYear}</span>
            </div>
          </div>

          <div className="mw-rise mw-delay-1 relative mx-auto w-full max-w-[540px]">
            <svg
              aria-hidden="true"
              className="mw-orbit pointer-events-none absolute inset-0 h-full w-full text-line"
              viewBox="0 0 600 600"
              fill="none"
            >
              <ellipse
                cx="300"
                cy="300"
                rx="276"
                ry="214"
                stroke="currentColor"
                strokeWidth="1"
                strokeDasharray="2 10"
              />
              <circle cx="300" cy="86" r="4" fill="var(--color-accent)" />
            </svg>

            <div className="mw-float relative px-4 pt-2 dark:mx-auto dark:max-w-[94%] dark:rounded-[2.5rem] dark:bg-stage dark:px-6 dark:py-6">
              <HeroTee label={`${home.heroPiece} — ${home.heroLabel}`} />
            </div>

            <div className="absolute inset-x-4 bottom-3 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              <span>MW / 001</span>
              <span>{home.heroPiece}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 04 — Brand statistics */}
      <section className="border-b border-line" aria-label={home.heroLabel}>
        <div className="mw-container grid md:grid-cols-3">
          {home.stats.map((stat, index) => (
            <div
              key={stat.note}
              className={`flex items-center gap-4 py-6 md:px-8 md:py-8 ${
                index > 0 ? "border-t border-line md:border-s md:border-t-0" : ""
              } ${index === 0 ? "md:ps-0" : ""} ${
                index === home.stats.length - 1 ? "md:pe-0" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper-dim text-ink-soft">
                <FeatureIcon name={stat.icon} size={20} />
              </span>
              <div>
                <p className="flex items-baseline gap-1.5">
                  <span className="text-[2rem] font-black leading-none tracking-tight">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-sm font-semibold text-ink">{stat.unit}</span>
                  )}
                </p>
                <p className="mt-1.5 text-[11px] leading-snug text-ink-soft">
                  {stat.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 05 — Product collections */}
      <section className="mw-container py-16 md:py-24">
        <div className="mw-reveal flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mw-eyebrow">{home.collectionsEyebrow}</p>
            <h2 className="mw-display mt-3 text-3xl md:text-5xl">
              {home.collectionsTitle}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
              {home.collectionsSubtitle}
            </p>
          </div>
          <Link
            href={`/${locale}/products`}
            className="group inline-flex shrink-0 items-center gap-2 self-start border-b border-ink pb-1 text-xs font-semibold sm:self-auto"
          >
            {home.collectionsCta}
            <ArrowRightIcon
              size={15}
              className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100 rtl:group-hover:-translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-5 lg:gap-5">
          {garmentTypes.map((type) => {
            const product = products.find((item) => item.type === type);

            return (
              <Link
                key={type}
                href={`/${locale}/products?type=${type}`}
                className="group block"
              >
                <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-stage">
                  <span
                    aria-hidden="true"
                    className="absolute -end-8 -top-8 h-28 w-28 rounded-full border border-line"
                  />
                  <Garment
                    type={type}
                    color={collectionColor[type]}
                    className="h-full w-full p-5 transition-transform duration-700 ease-out group-hover:scale-[1.05] sm:p-7"
                  />
                  <span className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink shadow-sm transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
                    <ArrowUpRightIcon size={17} />
                  </span>
                </div>

                <div className="mt-4 px-1">
                  <h3 className="text-sm font-semibold">
                    {garmentCollections[type][locale]}
                  </h3>
                  {product && (
                    <p className="mt-1 text-[11px] text-ink-soft">
                      {home.collectionsFrom}{" "}
                      <span className="tabular-nums">
                        {formatPrice(product.price, locale)}
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 06 — How MW works */}
      <section id="how" className="mw-container scroll-mt-28 pb-16 md:pb-24">
        <div className="mw-reveal rounded-[2rem] bg-paper-dim px-5 py-10 sm:px-9 md:rounded-[2.5rem] md:px-12 md:py-14">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mw-eyebrow">{home.howEyebrow}</p>
              <h2 className="mw-display mt-3 text-3xl md:text-5xl">{home.howTitle}</h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
                {home.howSubtitle}
              </p>
            </div>
            <Link
              href={`/${locale}/studio`}
              className="mw-btn mw-btn-solid group self-start"
            >
              {home.howCta}
              <ArrowRightIcon
                size={16}
                className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          </div>

          <ol className="mt-9 grid gap-4 md:mt-11 md:grid-cols-3 md:gap-6">
            {home.steps.map((step, index) => (
              <li
                key={step.n}
                className="relative rounded-2xl border border-line bg-paper p-5 sm:p-6"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper-dim text-ink">
                    <FeatureIcon name={step.icon} size={20} />
                  </span>
                  <span className="text-[11px] font-bold tabular-nums tracking-[0.1em] text-ink-soft">
                    {step.n}
                  </span>
                </div>
                <h3 className="mt-6 text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
                  {step.body}
                </p>

                {index < home.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute -end-4 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper text-ink-soft md:flex"
                  >
                    <ArrowRightIcon size={15} className="rtl:-scale-x-100" />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 07 — Design Studio promotion */}
      <section className="mw-container pb-16 md:pb-24">
        <div className="mw-reveal grid items-center gap-8 rounded-[2rem] bg-paper-dim p-5 sm:p-8 md:rounded-[2.5rem] lg:grid-cols-2 lg:gap-14 lg:p-14">
          <div>
            <p className="mw-eyebrow">{home.studioPromoEyebrow}</p>
            <h2 className="mw-display mt-3 text-3xl md:text-5xl">
              {home.studioPromoTitle}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
              {home.studioPromoBody}
            </p>
            <Link
              href={`/${locale}/studio`}
              className="mw-btn mw-btn-solid group mt-7"
            >
              {home.studioPromoCta}
              <ArrowRightIcon
                size={16}
                className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          </div>

          <StudioVideo caption={home.studioPromoCaption} />
        </div>
      </section>

      {/* 08 — Community creations */}
      <section id="community" className="scroll-mt-24 border-y border-line bg-paper">
        <div className="mw-container py-16 md:py-24">
          <div className="mw-reveal flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mw-eyebrow">{home.communityEyebrow}</p>
              <h2 className="mw-display mt-3 text-3xl md:text-5xl">
                {home.communityTitle}
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">
                {home.communitySubtitle}
              </p>
              <p className="mt-2 max-w-lg text-[10px] leading-relaxed text-ink-soft/80">
                {home.communityNote}
              </p>
            </div>
          </div>

          <div className="mw-reveal mt-8">
            <CommunityCarousel
              samples={home.communitySamples}
              locale={locale}
              labels={{
                prev: home.communityPrev,
                next: home.communityNext,
                sample: home.communitySample,
                region: home.communityTitle,
              }}
            />
          </div>
        </div>
      </section>

      {/* 09 — Final call to action */}
      <section className="mw-container py-16 md:py-24">
        <div className="mw-reveal relative overflow-hidden rounded-[2rem] bg-ink px-6 py-12 text-paper sm:px-10 md:rounded-[2.5rem] md:px-14 md:py-20">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -end-4 select-none font-display text-[17rem] leading-none text-paper/[0.055] sm:text-[22rem] md:-bottom-40 md:text-[28rem]"
          >
            MW
          </span>

          <div className="relative flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between md:gap-12">
            <div className="max-w-xl">
              <h2 className="mw-display text-3xl md:text-5xl">{home.finalTitle}</h2>
              <p className="mt-4 text-sm leading-relaxed text-paper/70">
                {home.finalBody}
              </p>
            </div>
            <Link
              href={`/${locale}/studio`}
              className="mw-btn mw-btn-light group shrink-0"
            >
              {home.finalCta}
              <ArrowRightIcon
                size={16}
                className="transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
