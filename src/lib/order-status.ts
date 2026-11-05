export type OrderStatus =
  | "new"
  | "confirmed"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancelled";

/** Every status in display order. */
export const ORDER_STATUSES: OrderStatus[] = [
  "new",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
];

/**
 * The order lifecycle. Kept in its own client-safe module so the admin UI and
 * the server enforce exactly the same rules (the database trigger mirrors this
 * map in supabase/migrations/003_order_integrity.sql).
 *
 *   new → confirmed → in_production → shipped → delivered
 *   any active status → cancelled
 *
 * `delivered` and `cancelled` are terminal. Correcting a mistake there needs an
 * explicit SQL statement, documented in README.md.
 */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["confirmed", "cancelled"],
  confirmed: ["in_production", "shipped", "cancelled"],
  in_production: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && ORDER_STATUSES.includes(value as OrderStatus);
}

export function allowedNextStatuses(status: OrderStatus): OrderStatus[] {
  return STATUS_TRANSITIONS[status] ?? [];
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return false;
  return allowedNextStatuses(from).includes(to);
}

/** True while the order can still move somewhere. */
export function isOpen(status: OrderStatus): boolean {
  return allowedNextStatuses(status).length > 0;
}
