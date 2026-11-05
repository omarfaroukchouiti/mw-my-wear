import type { Dictionary } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders";

const styles: Record<OrderStatus, string> = {
  new: "border-ink bg-ink text-paper",
  confirmed: "border-line bg-paper-dim text-ink",
  in_production: "border-amber-600 bg-amber-50 text-amber-800",
  shipped: "border-blue-700 bg-blue-50 text-blue-800",
  delivered: "border-green-700 bg-green-50 text-green-800",
  cancelled: "border-red-600 bg-red-50 text-red-700",
};

export function StatusPill({
  status,
  dict,
}: {
  status: OrderStatus;
  dict: Dictionary;
}) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${styles[status]}`}
    >
      {dict.status[status]}
    </span>
  );
}
