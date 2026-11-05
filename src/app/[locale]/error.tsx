"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const copy = {
  ar: {
    title: "حدث خطأ غير متوقع",
    body: "لم تكتمل هذه الصفحة. يمكنك إعادة المحاولة، أو العودة إلى المتجر. سلتك وتصميمك محفوظان في متصفحك.",
    retry: "إعادة المحاولة",
    home: "الصفحة الرئيسية",
    shop: "المتجر",
  },
  en: {
    title: "Something went wrong",
    body: "This page did not finish loading. Try again, or head back to the shop. Your cart and design are saved in your browser.",
    retry: "Try again",
    home: "Home",
    shop: "Shop",
  },
};

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const locale = pathname?.startsWith("/en") ? "en" : "ar";
  const t = copy[locale];

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mw-container flex min-h-[60vh] flex-col justify-center py-16">
      <p className="mw-eyebrow">MW — {error.digest ?? "500"}</p>
      <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{t.title}</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft">{t.body}</p>

      <div className="mt-8 flex flex-wrap gap-3">
        <button type="button" onClick={reset} className="mw-btn mw-btn-solid">
          {t.retry}
        </button>
        <Link href={`/${locale}`} className="mw-btn mw-btn-ghost">
          {t.home}
        </Link>
        <Link href={`/${locale}/products`} className="mw-btn mw-btn-ghost">
          {t.shop}
        </Link>
      </div>
    </div>
  );
}
