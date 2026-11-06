import Link from "next/link";

import { site } from "@/lib/site";

/**
 * MW brand lock-up.
 *
 * The official mark is a light (#F2F2EE) vector, so it is displayed on an ink
 * plate instead of being recoloured or inverted — the supplied file stays
 * byte-for-byte untouched. Set `site.logo` in `src/lib/site.ts` to swap the
 * asset; the temporary text lock-up is only a fallback when no file is set.
 */
export function Logo({
  locale,
  size = "md",
}: {
  locale: string;
  size?: "md" | "lg";
}) {
  const isLarge = size === "lg";

  const plate = isLarge
    ? "h-14 rounded-2xl px-3"
    : "h-11 rounded-xl px-2";
  const mark = isLarge ? "h-10" : "h-8";
  const word = isLarge ? "text-[12px]" : "text-[11px]";

  return (
    <Link
      href={`/${locale}`}
      aria-label="MW — My Wear Make it yours"
      className="group inline-flex shrink-0 items-center gap-2.5"
    >
      {site.logo ? (
        <>
          <span
            className={`flex items-center justify-center overflow-hidden bg-[#111111] ring-1 ring-ink/10 ${plate}`}
          >
            <img
              src={site.logo}
              alt=""
              aria-hidden="true"
              width={880}
              height={510}
              decoding="async"
              className={`${mark} w-auto`}
            />
          </span>
          <span
            aria-hidden="true"
            className="hidden flex-col leading-none md:flex"
          >
            <span className={`font-extrabold tracking-[0.2em] ${word}`}>
              MY WEAR
            </span>{" "}
            <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.26em] text-ink-soft">
              Make it yours
            </span>
          </span>
        </>
      ) : (
        <>
          <span
            aria-hidden="true"
            className={`relative flex items-center justify-center overflow-hidden bg-[#111111] text-[#f5f2ec] transition-transform duration-300 group-hover:-rotate-3 ${
              isLarge ? "h-12 w-12 rounded-2xl" : "h-10 w-10 rounded-xl"
            }`}
          >
            <span
              className={`font-display leading-none tracking-tight ${
                isLarge ? "text-[23px]" : "text-[19px]"
              }`}
            >
              MW
            </span>
            <span className="absolute bottom-1.5 h-px w-4 bg-[#f5f2ec]/40" />
          </span>
          <span
            aria-hidden="true"
            className="hidden flex-col leading-none min-[380px]:flex"
          >
            <span
              className={`font-extrabold tracking-[0.16em] ${
                isLarge ? "text-[15px]" : "text-[13px]"
              }`}
            >
              MY WEAR
            </span>{" "}
            <span className="mt-1 text-[8px] font-medium uppercase tracking-[0.28em] text-ink-soft">
              Make it yours
            </span>
          </span>
        </>
      )}
    </Link>
  );
}
