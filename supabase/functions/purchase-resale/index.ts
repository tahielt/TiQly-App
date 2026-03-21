import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, serviceClient } = await requireUser(req);
    const { listingId } = await req.json();

    if (!listingId) {
      return jsonResponse({ error: "listingId requerido" }, 400);
    }

    const { data, error } = await serviceClient.rpc("purchase_resale_atomic", {
      p_listing_id: listingId,
      p_buyer_id: user.id,
    });

    if (error || !data) {
      const code = (error?.message || "").toUpperCase();
      if (code.includes("LISTING_NOT_AVAILABLE") || code.includes("TICKET_NOT_TRANSFERABLE")) {
        return jsonResponse({ error: "La publicación ya no está disponible" }, 409);
      }
      if (code.includes("CANNOT_BUY_OWN_LISTING")) {
        return jsonResponse({ error: "No podés comprar tu propia publicación" }, 403);
      }
      return jsonResponse({ error: "No se pudo completar la compra" }, 500);
    }

    return jsonResponse(data, 200);
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("purchase-resale error", error);
    return jsonResponse({ error: "Error interno" }, 500);
  }
});
