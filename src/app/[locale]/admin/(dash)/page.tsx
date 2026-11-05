import { notFound } from "next/navigation";

import { AdminOrders } from "@/components/admin/orders-table";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function AdminOrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <AdminOrders locale={locale} dict={getDictionary(locale)} />;
}
