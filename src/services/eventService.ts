import { supabase } from '../lib/supabase';
import { Event, EventTicketType } from '../types/event';

const DEFAULT_COORDS = { latitude: -41.133, longitude: -71.31 };

const toNumber = (value: any, fallback: number) => {
  const parsed = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value: any) => {
  return value ? new Date(value) : new Date();
};

const isMissingRelation = (error: any, name: string) => {
  const message = (error?.message || '').toLowerCase();
  return message.includes(name) && (message.includes('does not exist') || message.includes('relation'));
};

const isMissingColumn = (error: any, name: string) => {
  const message = (error?.message || '').toLowerCase();
  return error?.code === '42703' || (message.includes('column') && message.includes(name.toLowerCase()));
};

const SELECT_WITH_TICKETS = `
  *,
  organizer:profiles!organizer_id (
    name
  ),
  ticket_types:ticket_types (
    id,
    name,
    price,
    quantity,
    available,
    sale_start_date,
    sale_end_date
  )
`;

const SELECT_BASIC = `
  *,
  organizer:profiles!organizer_id (
    name
  )
`;

const mapTicketTypes = (row: any): EventTicketType[] => {
  const raw = Array.isArray(row.ticket_types)
    ? row.ticket_types
    : Array.isArray(row.ticketTypes)
      ? row.ticketTypes
      : [];

  return raw.map((type: any, index: number) => ({
    id: type.id || `tier-${index}`,
    name: type.name || 'General',
    price: toNumber(type.price, 0),
    quantity: toNumber(type.quantity, 0),
    available: toNumber(type.available ?? type.quantity, 0),
    saleStartDate: type.sale_start_date ? new Date(type.sale_start_date) : toDate(row.start_date || row.startDate),
    saleEndDate: type.sale_end_date
      ? new Date(type.sale_end_date)
      : toDate(row.end_date || row.endDate || row.start_date || row.startDate),
  }));
};

const mapEventRow = (row: any): Event => {
  const locationAddress = row.address || row.location_address || row.location_name || '';
  const locationCity = row.city || row.location_city || '';
  const latitude = toNumber(row.latitude ?? row.location_lat ?? row.location_latitude, DEFAULT_COORDS.latitude);
  const longitude = toNumber(row.longitude ?? row.location_lng ?? row.location_longitude, DEFAULT_COORDS.longitude);

  const ticketTypes = mapTicketTypes(row);
  const basePrice = row.price !== undefined ? toNumber(row.price, 0) : undefined;
  const lowestTicketPrice = ticketTypes.length > 0
    ? Math.min(...ticketTypes.map((t) => t.price || 0))
    : 0;
  const derivedPrice = basePrice !== undefined ? basePrice : lowestTicketPrice;

  const startDateValue = row.start_date || row.startDate || row.event_date || row.eventDate || row.created_at;
  const endDateValue = row.end_date || row.endDate || row.start_date || row.startDate || row.created_at;

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    organizerId: row.organizer_id || row.organizerId || '',
    organizerName: row.organizer?.name || row.organizer_name || 'Organizador',
    type: row.is_public === false ? 'private' : 'public',
    status: row.status || 'published',
    location: {
      address: locationAddress,
      city: locationCity,
      coordinates: {
        latitude,
        longitude,
      },
    },
    startDate: toDate(startDateValue),
    endDate: toDate(endDateValue),
    coverImage: row.cover_image || row.coverImage,
    gallery: row.gallery || [],
    price: derivedPrice,
    ticketTypes,
    attendeeCount: row.attendee_count || 0,
    maxAttendees: row.capacity || row.max_attendees,
    tags: row.tags || [],
    category: row.category || 'Fiesta Electrónica',
    spotifyArtist: row.spotify_artist || row.spotifyArtist || null,
    spotifyPlaylist: row.spotify_playlist || row.spotifyPlaylist || null,
    ageRestriction: row.age_restriction || row.ageRestriction,
    createdAt: toDate(row.created_at || startDateValue),
    updatedAt: toDate(row.updated_at || row.created_at || startDateValue),
  };
};

const runEventQuery = async (buildQuery: (select: string) => any) => {
  let { data, error } = await buildQuery(SELECT_WITH_TICKETS);

  if (error && isMissingRelation(error, 'ticket_types')) {
    const fallback = await buildQuery(SELECT_BASIC);
    data = fallback.data;
    error = fallback.error;
  }

  return { data: data || [], error };
};

const runEventSingle = async (buildQuery: (select: string) => any) => {
  let { data, error } = await buildQuery(SELECT_WITH_TICKETS).maybeSingle();

  if (error && isMissingRelation(error, 'ticket_types')) {
    const fallback = await buildQuery(SELECT_BASIC).maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  return { data: data || null, error };
};

export interface CreateEventResult {
  success: boolean;
  eventId?: string;
  billing?: {
    publishFeeApplied: number;
    publishFeeThreshold: number;
    billingMode: 'included' | 'per_event';
    eventsThisMonth: number;
    eligibleForVolumePlan: boolean;
  };
  error?: string;
}

export const eventService = {
  getEvents: async (): Promise<Event[]> => {
    try {
      const { data, error } = await runEventQuery((select) =>
        supabase.from('events').select(select),
      );

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      return (data || [])
        .map(mapEventRow)
        .filter((event: Event) => event.status === 'published' || !event.status);
    } catch (error) {
      console.error('EventService Error:', error);
      return [];
    }
  },

  getEventsByOrganizer: async (organizerId: string, includeDrafts = true): Promise<Event[]> => {
    try {
      const { data, error } = await runEventQuery((select) =>
        supabase.from('events').select(select).eq('organizer_id', organizerId),
      );

      if (error && isMissingColumn(error, 'organizer_id')) {
        const fallback = await eventService.getEvents();
        const filtered = fallback.filter((event: Event) => event.organizerId === organizerId);
        return includeDrafts ? filtered : filtered.filter((event: Event) => event.status === 'published');
      }

      if (error) {
        console.error('Error fetching organizer events:', error);
        return [];
      }

      const mapped = (data || []).map(mapEventRow);
      return includeDrafts ? mapped : mapped.filter((event: Event) => event.status === 'published');
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      return [];
    }
  },

  getEventById: async (id: string): Promise<Event | null> => {
    try {
      const { data, error } = await runEventSingle((select) =>
        supabase.from('events').select(select).eq('id', id),
      );

      if (error) {
        throw error;
      }

      if (!data) return null;
      return mapEventRow(data);
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  },

  createEvent: async (eventData: any, userId: string): Promise<CreateEventResult> => {
    try {
      const payload = {
        title: eventData.title,
        description: eventData.description || '',
        category: eventData.category || 'Fiesta Electrónica',
        type: eventData.type || 'public',
        coverImage: eventData.coverImage,
        startDate: eventData.startDate?.toISOString ? eventData.startDate.toISOString() : eventData.startDate,
        endDate: eventData.endDate?.toISOString ? eventData.endDate.toISOString() : eventData.endDate,
        tags: eventData.tags || [],
        spotifyArtist: eventData.spotifyArtist || null,
        spotifyPlaylist: eventData.spotifyPlaylist || null,
        location: {
          address: eventData.location?.address || eventData.address || 'Sin dirección',
          city: eventData.location?.city || eventData.city || 'Bariloche',
          coordinates: {
            latitude: eventData.location?.coordinates?.latitude || toNumber(eventData.latitude, DEFAULT_COORDS.latitude),
            longitude: eventData.location?.coordinates?.longitude || toNumber(eventData.longitude, DEFAULT_COORDS.longitude),
          },
        },
      };

      const ticketTypes = Array.isArray(eventData.ticketTypes)
        ? eventData.ticketTypes.map((ticket: any) => ({
            name: ticket.name,
            price: ticket.price,
            quantity: ticket.quantity,
            available: ticket.available ?? ticket.quantity,
          }))
        : [];

      const { data, error } = await supabase.functions.invoke('publish-event', {
        body: {
          organizerId: userId,
          event: payload,
          ticketTypes,
        },
      });

      if (error || !data?.event?.id) {
        return {
          success: false,
          error: error?.message || data?.error || 'No se pudo crear el evento',
        };
      }

      return {
        success: true,
        eventId: data.event.id,
        billing: {
          publishFeeApplied: Number(data.billing?.publishFeeApplied || 0),
          publishFeeThreshold: Number(data.billing?.publishFeeThreshold || 25),
          billingMode: data.billing?.billingMode === 'per_event' ? 'per_event' : 'included',
          eventsThisMonth: Number(data.billing?.eventsThisMonth || 1),
          eligibleForVolumePlan: Boolean(data.billing?.eligibleForVolumePlan),
        },
      };
    } catch (error: any) {
      console.error('CreateEvent Error:', error);
      return {
        success: false,
        error: error?.message || 'No se pudo crear el evento',
      };
    }
  },
};


