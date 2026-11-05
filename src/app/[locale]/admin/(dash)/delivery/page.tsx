import { notFound } from "next/navigation";

import { AdminDeliveryRates } from "@/components/admin/delivery-rates";
import { getDictionary, isLocale } from "@/lib/i18n";

export default async function AdminDeliveryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-lg font-black md:text-xl">{dict.admin.deliveryTitle}</h2>
        <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-ink-soft">
          {dict.admin.deliverySubtitle}
        </p>
      </div>
      <AdminDeliveryRates locale={locale} dict={dict} />
    </section>
  );
}
