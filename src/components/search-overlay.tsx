"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Garment } from "@/components/garment";
import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  CloseIcon,
  SearchIcon,
} from "@/components/icons";
import type { Dictionary, Locale } from "@/lib/i18n";
import {
  formatPrice,
  garmentCollections,
  garmentLabels,
  products,
} from "@/lib/products";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  locale: Locale;
  labels: Dictionary["nav"];
};

export function SearchOverlay({ open, onClose, locale, labels }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];

    return products
      .filter((product) => {
        const haystack = [
          product.name[locale],
          product.name.ar,
          product.name.en,
          garmentLabels[product.type][locale],
          garmentCollections[product.type][locale],
          product.blurb[locale],
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      })
      .slice(0, 7);
  }, [locale, query]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] overflow-y-auto bg-black/45 p-4 pt-[10vh] backdrop-blur-[2px] sm:pt-[14vh]"
      role="presentation"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={labels.search}
        className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-paper shadow-[0_30px_90px_-30px_rgba(0,0,0,0.45)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 sm:px-5">
          <SearchIcon size={19} className="shrink-0 text-ink-soft" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.searchPlaceholder}
            autoComplete="off"
            className="h-10 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label={labels.close}
            className="mw-icon-btn shrink-0"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="max-h-[56vh] overflow-y-auto p-2 sm:p-3">
          {!query.trim() && (
            <div className="p-3 sm:p-4">
              <p className="text-xs leading-relaxed text-ink-soft">{labels.searchHint}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {products.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/${locale}/products?type=${product.type}`}
                    onClick={onClose}
                    className="rounded-full border border-line px-3 py-1.5 text-[11px] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
                  >
                    {garmentCollections[product.type][locale]}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {query.trim() && results.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-ink-soft">
              {labels.searchEmpty}
            </p>
          )}

          {results.length > 0 && (
            <ul className="space-y-1">
              {results.map((product) => (
                <li key={product.slug}>
                  <Link
                    href={`/${locale}/products/${product.slug}`}
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-paper-dim"
                  >
                    <span className="flex h-14 w-12 shrink-0 items-center justify-center rounded-xl bg-stage">
                      <Garment
                        type={product.type}
                        color={product.colors[0].hex}
                        className="h-full w-full p-1"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {product.name[locale]}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-ink-soft">
                        {garmentLabels[product.type][locale]} ·{" "}
                        {formatPrice(product.price, locale)}
                      </span>
                    </span>
                    <ArrowUpRightIcon
                      size={17}
                      className="shrink-0 text-ink-soft transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-line bg-paper-dim px-4 py-3 sm:px-5">
          <Link
            href={`/${locale}/products`}
            onClick={onClose}
            className="group flex items-center justify-between text-xs font-semibold"
          >
            {labels.searchAll}
            <ArrowRightIcon
              size={16}
              className="transition-transform group-hover:translate-x-1 rtl:-scale-x-100"
            />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
