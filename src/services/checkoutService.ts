// ============================================================
// checkoutService · Compra real vía Edge Function + Mercado Pago
// Flujo: startCheckout (hold atómico + preference) →
// openMercadoPagoCheckout (app/web de MP) →
// waitForPayment (el webhook confirma; acá solo se observa).
// El precio NUNCA se calcula ni se manda desde el cliente.
// ============================================================

import { AppState, Linking } from 'react-native';
import { supabase } from '../lib/supabase';

export interface CheckoutSession {
    order_id: string;
    status: string;
    expires_at: string;
    quantity: number;
    unit_price: number;
    service_fee: number;
    total: number;
    split: boolean;
    init_point: string;
    sandbox_init_point: string | null;
}

export type OrderStatus =
    | 'pending'
    | 'paid'
    | 'expired'
    | 'cancelled'
    | 'refund_required'
    | 'refunded';

export type PaymentOutcome = 'paid' | 'pending' | 'failed';

/** Crea la orden con hold de stock y devuelve la sesión de pago de MP. */
export async function startCheckout(
    ticketTypeId: string,
    quantity: number = 1,
): Promise<CheckoutSession> {
    const { data, error } = await supabase.functions.invoke('create-order', {
        body: { ticket_type_id: ticketTypeId, quantity },
    });

    if (error) {
        // La Edge Function responde { error, message } con mensajes para UI
        let userMessage = 'No se pudo iniciar la compra. Intentá de nuevo.';
        try {
            const body = await (error as any)?.context?.json?.();
            if (body?.message) userMessage = body.message;
        } catch { /* sin cuerpo legible */ }
        const err: any = new Error(userMessage);
        err.userMessage = userMessage;
        throw err;
    }
    return data as CheckoutSession;
}

/** Abre el checkout de Mercado Pago (app de MP si está instalada, o navegador). */
export async function openMercadoPagoCheckout(session: CheckoutSession): Promise<void> {
    const url = session.init_point ?? session.sandbox_init_point;
    if (!url) throw new Error('La sesión de pago no tiene init_point');
    await Linking.openURL(url);
}

/** Lee el estado actual de la orden (RLS: solo el dueño puede verla). */
export async function getOrderStatus(orderId: string): Promise<OrderStatus | null> {
    const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .maybeSingle();
    return (data?.status as OrderStatus) ?? null;
}

/**
 * Espera el resultado del pago. El webhook de MP es quien confirma:
 * acá solo se observa la orden con polling suave + chequeo al volver
 * a la app. Si el usuario vuelve y el pago sigue pendiente unos
 * segundos, resuelve 'pending' (la entrada aparece sola al acreditarse).
 */
export function waitForPayment(orderId: string): Promise<PaymentOutcome> {
    return new Promise((resolve) => {
        let settled = false;
        let returnedChecks = 0;

        const finish = (outcome: PaymentOutcome) => {
            if (settled) return;
            settled = true;
            clearInterval(pollTimer);
            clearTimeout(hardTimeout);
            appStateSub.remove();
            resolve(outcome);
        };

        const check = async () => {
            const status = await getOrderStatus(orderId);
            if (status === 'paid') finish('paid');
            else if (status === 'expired' || status === 'cancelled') finish('failed');
        };

        // Poll de fondo cada 4s mientras el usuario está en MP
        const pollTimer = setInterval(check, 4000);

        // Al volver a TiQly: chequear ya, a los 3s y a los 8s;
        // si sigue pendiente, soltar al usuario con 'pending'.
        const appStateSub = AppState.addEventListener('change', (state) => {
            if (state !== 'active' || settled) return;
            check();
            setTimeout(check, 3000);
            setTimeout(async () => {
                returnedChecks += 1;
                await check();
                if (!settled && returnedChecks >= 1) finish('pending');
            }, 8000);
        });

        // Tope duro: el hold dura 10 min; a los 11 cortamos la espera
        const hardTimeout = setTimeout(() => finish('pending'), 11 * 60 * 1000);

        check();
    });
}
