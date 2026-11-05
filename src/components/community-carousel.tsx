"use client";

import { useEffect, useRef, useState } from "react";

import { Garment } from "@/components/garment";
import { ArrowLeftIcon, ArrowRightIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { isGarmentType } from "@/lib/products";

type Sample = {
  title: string;
  type: string;
  color: string;
};

type CommunityCarouselProps = {
  samples: Sample[];
  locale: Locale;
  labels: {
    prev: string;
    next: string;
    sample: string;
    region: string;
  };
};

export function CommunityCarousel({
  samples,
  locale,
  labels,
}: CommunityCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const position = Math.abs(track.scrollLeft);
      setAtStart(position <= 4);
      setAtEnd(position >= max - 4);
    };

    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollByCard = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;

    const first = track.querySelector("li");
    const gap = 20;
    const delta = first ? first.clientWidth + gap : track.clientWidth * 0.8;
    const rtl = window.getComputedStyle(track).direction === "rtl";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.scrollBy({
      left: direction * delta * (rtl ? -1 : 1),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const PrevIcon = locale === "ar" ? ArrowRightIcon : ArrowLeftIcon;
  const NextIcon = locale === "ar" ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => scrollByCard(-1)}
          disabled={atStart}
          aria-label={labels.prev}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
        >
          <PrevIcon size={18} />
        </button>
        <button
          type="button"
          onClick={() => scrollByCard(1)}
          disabled={atEnd}
          aria-label={labels.next}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:pointer-events-none disabled:opacity-30"
        >
          <NextIcon size={18} />
        </button>
      </div>

      <ul
        ref={trackRef}
        role="region"
        aria-label={labels.region}
        tabIndex={0}
        className="mw-no-scrollbar -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-2"
      >
        {samples.map((sample, index) => {
          const type = isGarmentType(sample.type) ? sample.type : "tee";

          return (
            <li
              key={`${sample.title}-${index}`}
              className="group w-[80%] shrink-0 snap-start sm:w-[46%] lg:w-[31%] xl:w-[23.5%]"
            >
              <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-stage">
                <div
                  aria-hidden="true"
                  className="absolute -end-10 -top-10 h-36 w-36 rounded-full border border-line"
                />
                <span className="absolute start-3 top-3 z-10 rounded-full bg-paper/90 px-2.5 py-1 text-[9px] font-semibold text-ink-soft backdrop-blur-sm">
                  {labels.sample}
                </span>
                <Garment
                  type={type}
                  color={sample.color}
                  className="absolute inset-0 h-full w-full p-8 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
              </div>
              <div className="mt-3 flex items-baseline justify-between gap-3 px-1">
                <p className="text-[12px] font-semibold">{sample.title}</p>
                <span className="text-[9px] tabular-nums text-ink-soft">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
