import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, serviceClient } = await requireUser(req);
    const { ticketId, askingPrice, expiresInDays = 30 } = await req.json();

    if (!ticketId) {
      return jsonResponse({ error: "ticketId requerido" }, 400);
    }

    const parsedPrice = Number(askingPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      return jsonResponse({ error: "askingPrice inválido" }, 400);
    }

    const { data, error } = await serviceClient.rpc("create_resale_listing_atomic", {
      p_ticket_id: ticketId,
      p_seller_id: user.id,
      p_asking_price: parsedPrice,
      p_expires_in_days: Math.max(1, Number(expiresInDays) || 30),
    });

    if (error || !data) {
      const code = (error?.message || "").toUpperCase();
      if (code.includes("LISTING_ALREADY_EXISTS")) {
        return jsonResponse({ error: "Este ticket ya está publicado" }, 409);
      }
      if (code.includes("NOT_TICKET_OWNER")) {
        return jsonResponse({ error: "El ticket no te pertenece" }, 403);
      }
      if (code.includes("TICKET_NOT_ACTIVE") || code.includes("TICKET_ALREADY_USED")) {
        return jsonResponse({ error: "Este ticket no se puede revender" }, 409);
      }
      return jsonResponse({ error: "No se pudo crear la publicación" }, 500);
    }

    return jsonResponse(data, 200);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("create-resale-listing error", error);
    return jsonResponse({ error: "Error interno" }, 500);
  }
});
