import { notFound } from "next/navigation";

import { AdminOrderDetail } from "@/components/admin/order-detail";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function AdminOrderPage({
  params,
}: {
  params: Promise<{ locale: string; number: string }>;
}) {
  const { locale, number } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <AdminOrderDetail
      key={number}
      number={decodeURIComponent(number).toUpperCase()}
      locale={locale}
      dict={getDictionary(locale)}
    />
  );
}
