import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Supabase env missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { eventId, ticketTypeId, quantity = 1 } = await req.json();
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey);

    let basePrice = 0;
    let resolvedTicketTypeId: string | null = ticketTypeId ?? null;
    let resolvedTicketTypeName = "General";

    if (resolvedTicketTypeId) {
      const { data: ticketType, error: ticketTypeError } = await serviceClient
        .from("ticket_types")
        .select("id, name, price, available, quantity, event_id")
        .eq("id", resolvedTicketTypeId)
        .single();

      if (ticketTypeError || !ticketType) {
        return new Response(JSON.stringify({ error: "Ticket type inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (ticketType.event_id !== eventId) {
        return new Response(JSON.stringify({ error: "Ticket type no pertenece al evento" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const remaining = ticketType.available ?? ticketType.quantity ?? 0;
      if (remaining < safeQuantity) {
        return new Response(JSON.stringify({ error: "Entradas agotadas" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      basePrice = Number(ticketType.price) || 0;
      resolvedTicketTypeName = ticketType.name || resolvedTicketTypeName;
    } else {
      const { data: eventRow, error: eventError } = await serviceClient
        .from("events")
        .select("price")
        .eq("id", eventId)
        .single();

      if (eventError || !eventRow) {
        return new Response(JSON.stringify({ error: "Evento inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      basePrice = Number(eventRow.price) || 0;
    }

    const feeAmount = 0;
    const finalAmount = basePrice;

    const ticketId = crypto.randomUUID();
    const qrPayload = `${ticketId}:${userData.user.id}:${eventId}:${Date.now()}`;
    const qrCode = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(qrPayload));
    const qrHash = Array.from(new Uint8Array(qrCode)).map((b) => b.toString(16).padStart(2, "0")).join("");

    const { data: ticketRow, error: ticketError } = await serviceClient
      .from("tickets")
      .insert({
        id: ticketId,
        event_id: eventId,
        user_id: userData.user.id,
        ticket_type_id: resolvedTicketTypeId,
        qr_code: qrHash,
        status: "active",
        price_paid: finalAmount,
        original_owner_id: userData.user.id,
        purchase_date: new Date().toISOString(),
      })
      .select("id, ticket_type_id, price_paid, purchase_date, qr_code, created_at")
      .single();

    if (ticketError || !ticketRow) {
      return new Response(JSON.stringify({ error: "No se pudo crear el ticket" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (resolvedTicketTypeId) {
      const { data: ticketTypeRow } = await serviceClient
        .from("ticket_types")
        .select("available, quantity")
        .eq("id", resolvedTicketTypeId)
        .single();

      const available = ticketTypeRow?.available ?? ticketTypeRow?.quantity;
      if (available !== null && available !== undefined) {
        await serviceClient
          .from("ticket_types")
          .update({ available: Math.max(available - safeQuantity, 0) })
          .eq("id", resolvedTicketTypeId);
      }
    }

    return new Response(
      JSON.stringify({
        ticket: {
          id: ticketRow.id,
          ticketTypeId: ticketRow.ticket_type_id,
          ticketTypeName: resolvedTicketTypeName,
          pricePaid: ticketRow.price_paid,
          purchaseDate: ticketRow.purchase_date,
          qrCode: ticketRow.qr_code,
          createdAt: ticketRow.created_at,
        },
        pricing: {
          basePrice,
          feeAmount,
          finalAmount,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



