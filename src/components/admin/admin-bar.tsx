"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { Dictionary, Locale } from "@/lib/i18n";

export function AdminBar({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace(`/${locale}/admin/login`);
      router.refresh();
    }
  };

  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
      <div className="flex items-center gap-3">
        <span className="bg-ink px-2 py-1 font-display text-sm leading-none text-paper">MW</span>
        <span className="text-[10px] uppercase tracking-[0.25em] text-ink-soft">
          {dict.admin.title}
        </span>
      </div>

      <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-ink-soft">
        <nav aria-label={dict.admin.title} className="flex items-center gap-4">
          <Link
            href={`/${locale}/admin`}
            aria-current={pathname === `/${locale}/admin` ? "page" : undefined}
            className={
              pathname === `/${locale}/admin`
                ? "text-ink underline underline-offset-4"
                : "hover:text-ink"
            }
          >
            {dict.admin.orders}
          </Link>
          <Link
            href={`/${locale}/admin/delivery`}
            aria-current={pathname === `/${locale}/admin/delivery` ? "page" : undefined}
            className={
              pathname === `/${locale}/admin/delivery`
                ? "text-ink underline underline-offset-4"
                : "hover:text-ink"
            }
          >
            {dict.admin.deliveryRates}
          </Link>
        </nav>
        <Link href={`/${locale}`} className="hover:text-ink">
          {dict.admin.backToSite}
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={busy}
          className="border border-line px-3 py-1.5 transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
        >
          {dict.admin.logout}
        </button>
      </div>
    </div>
  );
}
