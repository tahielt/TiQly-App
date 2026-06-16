// ============================================================
// TiQly · Edge Function · mp-webhook
// Recibe las notificaciones de Mercado Pago, valida la firma,
// consulta el pago y confirma (emite tickets) o libera el hold.
// DEBE deployarse con verify_jwt = false (MP no manda JWT):
// ver supabase/config.toml.
//
// Secrets:
//   MP_ACCESS_TOKEN     token de la aplicación/cuenta plataforma
//   MP_WEBHOOK_SECRET   firma secreta del panel de webhooks de MP (recomendado)
// ============================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MP_TOKEN = Deno.env.get("MP_ACCESS_TOKEN")!;
const MP_WEBHOOK_SECRET = Deno.env.get("MP_WEBHOOK_SECRET") ?? "";

const ok = (msg = "ok") => new Response(msg, { status: 200 });

async function validSignature(req: Request, dataId: string): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET) return true; // sin secret configurado, no se valida (solo dev)
  const sig = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  const parts: Record<string, string> = {};
  for (const p of sig.split(",")) {
    const [k, v] = p.trim().split("=");
    if (k && v) parts[k] = v;
  }
  if (!parts.ts || !parts.v1) return false;

  // Manifest oficial de MP: id en minúsculas si es alfanumérico
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${parts.ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return hex === parts.v1;
}

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* notificaciones IPN viejas vienen sin body */ }

    const type =
      url.searchParams.get("type") ??
      url.searchParams.get("topic") ??
      (body?.type as string) ?? "";
    const dataId =
      url.searchParams.get("data.id") ??
      url.searchParams.get("id") ??
      ((body?.data as Record<string, unknown>)?.id as string | undefined) ?? "";

    // Solo nos interesan pagos; el resto se confirma con 200 para cortar reintentos
    if (!type.includes("payment") || !dataId) return ok("ignored");

    if (!(await validSignature(req, String(dataId)))) {
      console.error("mp-webhook: firma inválida");
      return new Response("invalid signature", { status: 401 });
    }

    // Consultar el pago. Los pagos de sellers OAuth también son visibles
    // con el token de la aplicación de marketplace.
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    if (!payRes.ok) {
      console.error("mp-webhook: no se pudo leer el pago", dataId, payRes.status);
      // 500 → MP reintenta con backoff (el pago puede no estar listo aún)
      return new Response("retry", { status: 500 });
    }

    const payment = await payRes.json();
    const orderId: string | undefined =
      payment.external_reference ?? payment?.metadata?.order_id;
    if (!orderId) return ok("no order reference");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    if (payment.status === "approved") {
      const { error } = await admin.rpc("confirm_order_paid", {
        p_order_id: orderId,
        p_mp_payment_id: String(payment.id),
      });
      if (error) {
        // PAID_AFTER_EXPIRY_NO_STOCK queda marcado refund_required: no reintentar
        if (error.message?.includes("PAID_AFTER_EXPIRY_NO_STOCK")) {
          console.error("mp-webhook: pago tardío sin stock, requiere reembolso", orderId);
          return ok("refund required");
        }
        console.error("mp-webhook: confirm_order_paid", error);
        return new Response("retry", { status: 500 });
      }
      return ok("paid");
    }

    if (["rejected", "cancelled", "charged_back"].includes(payment.status)) {
      await admin.rpc("release_order", { p_order_id: orderId });
      return ok("released");
    }

    // pending / in_process / refunded: nada que hacer todavía
    return ok(`status ${payment.status}`);
  } catch (e) {
    console.error("mp-webhook fatal:", e);
    return new Response("retry", { status: 500 });
  }
});
