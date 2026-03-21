import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, serviceClient } = await requireUser(req);
    const { eventId, ticketTypeId, quantity = 1 } = await req.json();
    const safeQuantity = Math.max(1, Number(quantity) || 1);

    if (!eventId) {
      return jsonResponse({ error: "eventId requerido" }, 400);
    }

    const { data, error } = await serviceClient.rpc("purchase_ticket_atomic", {
      p_user_id: user.id,
      p_event_id: eventId,
      p_ticket_type_id: ticketTypeId || null,
      p_quantity: safeQuantity,
    });

    if (error || !data) {
      const code = (error?.message || "").toUpperCase();
      if (code.includes("INSUFFICIENT_STOCK")) {
        return jsonResponse({ error: "Entradas agotadas" }, 409);
      }
      if (code.includes("EVENT_NOT_FOUND") || code.includes("EVENT_NOT_PUBLISHED")) {
        return jsonResponse({ error: "Evento inválido" }, 400);
      }
      return jsonResponse({ error: "No se pudo procesar la compra" }, 500);
    }

    return jsonResponse(data, 200);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("purchase-ticket error", error);
    return jsonResponse({ error: "Error interno" }, 500);
  }
});
