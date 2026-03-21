import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders, jsonResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

const DEFAULT_COORDS = { latitude: -41.133, longitude: -71.31 };
const PUBLISH_FEE_THRESHOLD = 25;

const toNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePct = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) return fallback;
  if (value < 0) return 0;
  if (value > 1) return value / 100;
  return value;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user, serviceClient } = await requireUser(req);
    const { event, ticketTypes = [] } = await req.json();

    if (!event?.title) {
      return jsonResponse({ error: "title requerido" }, 400);
    }

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

    const [{ data: configData }, { count: existingEventsCount, error: countError }] = await Promise.all([
      serviceClient.rpc("get_platform_config_public"),
      serviceClient
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("organizer_id", user.id)
        .gte("created_at", monthStart)
        .lt("created_at", nextMonthStart),
    ]);

    if (countError) {
      return jsonResponse({ error: "No se pudo validar la facturación del organizador" }, 500);
    }

    const publishFee = Number(configData?.publish_fee ?? 2500) || 2500;
    const eventsThisMonth = (existingEventsCount || 0) + 1;
    const publishFeeApplied = eventsThisMonth > PUBLISH_FEE_THRESHOLD ? publishFee : 0;
    const publishBillingMode = publishFeeApplied > 0 ? "per_event" : "included";

    const defaultCover = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200";
    const address = event.location?.address || event.address || "Sin dirección";
    const city = event.location?.city || event.city || "Bariloche";
    const latitude = event.location?.coordinates?.latitude || toNumber(event.latitude, DEFAULT_COORDS.latitude);
    const longitude = event.location?.coordinates?.longitude || toNumber(event.longitude, DEFAULT_COORDS.longitude);

    const eventRow = {
      title: event.title,
      description: event.description || "",
      organizer_id: user.id,
      category: event.category || "Fiesta Electrónica",
      cover_image: event.coverImage || defaultCover,
      address,
      city,
      latitude,
      longitude,
      start_date: event.startDate,
      end_date: event.endDate,
      status: "published",
      is_public: event.type !== "private",
      tags: Array.isArray(event.tags) ? event.tags : [],
      spotify_artist: event.spotifyArtist || null,
      spotify_playlist: event.spotifyPlaylist || null,
      publish_fee_applied: publishFeeApplied,
      publish_billing_mode: publishBillingMode,
      published_events_this_month: eventsThisMonth,
    };

    const insertEvent = async (row: Record<string, unknown>) =>
      serviceClient.from("events").insert(row).select("id, title, created_at, publish_fee_applied, publish_billing_mode, published_events_this_month").single();

    let { data: createdEvent, error: eventError } = await insertEvent(eventRow);

    const message = (eventError?.message || "").toLowerCase();
    if (eventError && ((eventError.code === "42703") || (message.includes("column") && (message.includes("address") || message.includes("latitude"))))) {
      const fallbackRow = {
        title: eventRow.title,
        description: eventRow.description,
        organizer_id: eventRow.organizer_id,
        category: eventRow.category,
        cover_image: eventRow.cover_image,
        location_name: address,
        location_address: address,
        location_lat: latitude,
        location_lng: longitude,
        start_date: eventRow.start_date,
        end_date: eventRow.end_date,
        status: eventRow.status,
        is_public: eventRow.is_public,
        tags: eventRow.tags,
        spotify_artist: eventRow.spotify_artist,
        spotify_playlist: eventRow.spotify_playlist,
        publish_fee_applied: publishFeeApplied,
        publish_billing_mode: publishBillingMode,
        published_events_this_month: eventsThisMonth,
      };

      const fallbackResult = await insertEvent(fallbackRow);
      createdEvent = fallbackResult.data;
      eventError = fallbackResult.error;
    }

    if (eventError || !createdEvent) {
      return jsonResponse({ error: "No se pudo crear el evento" }, 500);
    }

    const normalizedTicketTypes = Array.isArray(ticketTypes)
      ? ticketTypes.filter((ticket) => ticket?.name && Number(ticket?.quantity) > 0).map((ticket) => ({
          event_id: createdEvent.id,
          name: ticket.name,
          price: toNumber(ticket.price, 0),
          quantity: Math.max(1, toNumber(ticket.quantity, 1)),
          available: Math.max(1, toNumber(ticket.available ?? ticket.quantity, 1)),
          sale_start_date: event.startDate,
          sale_end_date: event.endDate,
        }))
      : [];

    if (normalizedTicketTypes.length > 0) {
      const { error: ticketTypesError } = await serviceClient.from("ticket_types").insert(normalizedTicketTypes);
      if (ticketTypesError) {
        await serviceClient.from("events").delete().eq("id", createdEvent.id);
        return jsonResponse({ error: "No se pudieron crear los tipos de entrada" }, 500);
      }
    }

    return jsonResponse({
      event: {
        id: createdEvent.id,
        title: createdEvent.title,
        createdAt: createdEvent.created_at,
      },
      billing: {
        publishFeeApplied,
        publishFeeThreshold: PUBLISH_FEE_THRESHOLD,
        billingMode: publishBillingMode,
        eventsThisMonth,
        eligibleForVolumePlan: eventsThisMonth > PUBLISH_FEE_THRESHOLD,
      },
      feeConfig: {
        primaryFeePct: normalizePct(Number(configData?.primary_fee_pct ?? 0.15), 0.15),
        resaleFeePct: normalizePct(Number(configData?.resale_fee_pct ?? 0.12), 0.12),
        publishFee,
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error("publish-event error", error);
    return jsonResponse({ error: "Error interno" }, 500);
  }
});
