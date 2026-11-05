import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminBar } from "@/components/admin/admin-bar";
import { ADMIN_COOKIE, verifyToken } from "@/lib/admin";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Admin — MW",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const store = await cookies();
  if (!(await verifyToken(store.get(ADMIN_COOKIE)?.value))) {
    redirect(`/${locale}/admin/login`);
  }

  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-8 md:py-10">
      <AdminBar locale={locale} dict={dict} />
      <div className="mb-6">
        <h1 className="text-2xl font-black md:text-3xl">{dict.admin.title}</h1>
        <p className="mt-1 text-[13px] text-ink-soft">{dict.admin.subtitle}</p>
      </div>
      {children}
    </div>
  );
}
