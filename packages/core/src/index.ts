// @tiqly/core · Lógica de dominio compartida entre mobile y web.
// REGLA: el cálculo autoritativo de precios vive en SQL
// (create_order_with_hold). Esto existe para PREVISUALIZAR
// en la UI y debe mantenerse espejado con platform_config.

export const SERVICE_FEE_RATE = 0.15;
export const HOLD_MINUTES = 10;

export type OrderStatus =
  | "pending"
  | "paid"
  | "expired"
  | "cancelled"
  | "refund_required"
  | "refunded";

export type TicketStatus =
  | "active"
  | "used"
  | "transferred"
  | "listed"
  | "cancelled"
  | "refunded";

export interface OrderTotals {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  serviceFee: number;
  total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Espejo del cálculo server-side, para mostrar el desglose antes de pagar. */
export function calcOrderTotals(
  unitPrice: number,
  quantity: number,
  feeRate: number = SERVICE_FEE_RATE,
): OrderTotals {
  const subtotal = round2(unitPrice * quantity);
  const serviceFee = round2(unitPrice * quantity * feeRate);
  return {
    unitPrice,
    quantity,
    subtotal,
    serviceFee,
    total: round2(subtotal + serviceFee),
  };
}

/** Formato ARS consistente en toda la plataforma. */
export function formatARS(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(amount);
}
