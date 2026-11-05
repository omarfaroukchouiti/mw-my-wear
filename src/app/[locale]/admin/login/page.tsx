import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AdminLoginForm } from "@/components/admin/login-form";
import { ADMIN_COOKIE, adminConfigured, verifyToken, weakPassword } from "@/lib/admin";
import { getDictionary, isLocale } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Admin — MW",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const store = await cookies();
  if (await verifyToken(store.get(ADMIN_COOKIE)?.value)) redirect(`/${locale}/admin`);

  const dict = getDictionary(locale);

  return (
    <div className="mw-container py-10 md:py-16">
      <div className="max-w-md">
        <p className="mw-eyebrow">MW — {dict.admin.title}</p>
        <h1 className="mt-2 text-2xl font-black md:text-3xl">{dict.admin.loginTitle}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{dict.admin.loginSubtitle}</p>
      </div>

      <div className="mt-8">
        <AdminLoginForm
          locale={locale}
          dict={dict}
          configured={adminConfigured()}
          weak={weakPassword()}
        />
      </div>
    </div>
  );
}
