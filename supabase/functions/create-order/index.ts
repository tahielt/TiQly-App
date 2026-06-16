// ============================================================
// TiQly · Edge Function · create-order
// POST { ticket_type_id: uuid, quantity?: number }
// 1. Autentica al comprador (JWT de Supabase)
// 2. RPC create_order_with_hold → hold atómico + precio server-side
// 3. Crea la preference de Mercado Pago (split si la org conectó MP)
// 4. Devuelve init_point para abrir el checkout
//
// Secrets requeridos (supabase secrets set):
//   MP_ACCESS_TOKEN   token de la cuenta plataforma TiQly
//   APP_BASE_URL      ej: https://tiqly.app  (back_urls / deep link bridge)
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_PLATFORM_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") ?? "https://tiqly.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// Errores de negocio que la RPC lanza a propósito → mensajes para la UI
const BUSINESS_ERRORS: Record<string, { status: number; message: string }> = {
  OUT_OF_STOCK: { status: 409, message: "No quedan entradas disponibles de este tipo." },
  MAX_PER_ORDER_EXCEEDED: { status: 400, message: "Superaste el máximo por compra." },
  EVENT_NOT_ON_SALE: { status: 409, message: "El evento no está a la venta." },
  TICKET_TYPE_INACTIVE: { status: 409, message: "Este tipo de entrada no está disponible." },
  SALES_NOT_STARTED: { status: 409, message: "La venta todavía no comenzó." },
  SALES_ENDED: { status: 409, message: "La venta ya finalizó." },
  TICKET_TYPE_NOT_FOUND: { status: 404, message: "Tipo de entrada inexistente." },
  INVALID_QUANTITY: { status: 400, message: "Cantidad inválida." },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    // ---- 1. Autenticación del comprador ----
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "unauthorized" }, 401);

    const { ticket_type_id, quantity = 1 } = await req.json().catch(() => ({}));
    if (!ticket_type_id) return json({ error: "ticket_type_id requerido" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // ---- 2. Hold atómico + precios server-side ----
    const { data: order, error: rpcError } = await admin.rpc("create_order_with_hold", {
      p_user_id: user.id,
      p_ticket_type_id: ticket_type_id,
      p_quantity: quantity,
    });

    if (rpcError) {
      const code = Object.keys(BUSINESS_ERRORS).find((k) => rpcError.message?.includes(k));
      if (code) {
        const { status, message } = BUSINESS_ERRORS[code];
        return json({ error: code, message }, status);
      }
      console.error("create_order_with_hold:", rpcError);
      return json({ error: "internal" }, 500);
    }

    // ---- 3. Contexto del evento + credenciales MP ----
    const { data: event } = await admin
      .from("events")
      .select("title, organization_id")
      .eq("id", order.event_id)
      .single();

    // Split payments: si la org conectó su cuenta MP (OAuth), el cobro entra
    // directo a su cuenta y TiQly retiene su fee vía marketplace_fee.
    // Fallback (orgs sin conectar todavía): cobra la cuenta plataforma.
    const { data: secrets } = await admin
      .from("organization_secrets")
      .select("mp_access_token")
      .eq("org_id", event?.organization_id ?? "")
      .maybeSingle();

    const sellerToken = secrets?.mp_access_token ?? null;
    const mpToken = sellerToken ?? MP_PLATFORM_TOKEN;
    const useSplit = Boolean(sellerToken);

    // ---- 4. Preference de Mercado Pago ----
    // El comprador ve un único precio final (base + servicio) por unidad.
    const unitWithFee =
      Math.round((Number(order.total) / order.quantity) * 100) / 100;

    const preferenceBody: Record<string, unknown> = {
      items: [{
        id: order.ticket_type_id,
        title: `Entrada · ${event?.title ?? "Evento"}`,
        quantity: order.quantity,
        currency_id: "ARS",
        unit_price: unitWithFee,
      }],
      external_reference: order.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      // Bridge https → deep link (tiqly://purchase/...) servido desde la web.
      back_urls: {
        success: `${APP_BASE_URL}/purchase/callback?order=${order.id}&s=success`,
        pending: `${APP_BASE_URL}/purchase/callback?order=${order.id}&s=pending`,
        failure: `${APP_BASE_URL}/purchase/callback?order=${order.id}&s=failure`,
      },
      auto_return: "approved",
      date_of_expiration: order.expires_at, // la preference muere con el hold
      statement_descriptor: "TIQLY",
      metadata: { order_id: order.id, user_id: user.id },
    };

    if (useSplit) {
      // Fee de TiQly retenido automáticamente del cobro del organizador
      preferenceBody.marketplace_fee = Number(order.service_fee);
    }

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": order.id,
      },
      body: JSON.stringify(preferenceBody),
    });

    if (!mpRes.ok) {
      console.error("MP preference error:", mpRes.status, await mpRes.text());
      await admin.rpc("release_order", { p_order_id: order.id });
      return json({ error: "payment_provider_error" }, 502);
    }

    const preference = await mpRes.json();

    await admin
      .from("orders")
      .update({ mp_preference_id: preference.id })
      .eq("id", order.id);

    // ---- 5. Respuesta para la app ----
    return json({
      order_id: order.id,
      status: order.status,
      expires_at: order.expires_at,
      quantity: order.quantity,
      unit_price: order.unit_price,
      service_fee: order.service_fee,
      total: order.total,
      split: useSplit,
      init_point: preference.init_point,
      sandbox_init_point: preference.sandbox_init_point ?? null,
    });
  } catch (e) {
    console.error("create-order fatal:", e);
    return json({ error: "internal" }, 500);
  }
});
