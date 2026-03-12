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
      : toDate(row.end_date || row.endDate || row.start_date || row.startDate)
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
        longitude
      }
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
    updatedAt: toDate(row.updated_at || row.created_at || startDateValue)
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

export const eventService = {
  /**
   * Fetch all published events from Supabase
   */
  getEvents: async (): Promise<Event[]> => {
    try {
      const { data, error } = await runEventQuery((select) =>
        supabase.from('events').select(select)
      );

      if (error) {
        console.error('Error fetching events:', error);
        return [];
      }

      return (data || [])
        .map(mapEventRow)
        .filter((event) => event.status === 'published' || !event.status);
    } catch (error) {
      console.error('EventService Error:', error);
      return [];
    }
  },

  /**
   * Get all events created by a specific organizer
   */
  getEventsByOrganizer: async (organizerId: string, includeDrafts = true): Promise<Event[]> => {
    try {
      const { data, error } = await runEventQuery((select) =>
        supabase.from('events').select(select).eq('organizer_id', organizerId)
      );

      if (error && isMissingColumn(error, 'organizer_id')) {
        const fallback = await eventService.getEvents();
        const filtered = fallback.filter((event) => event.organizerId === organizerId);
        return includeDrafts ? filtered : filtered.filter((event) => event.status === 'published');
      }

      if (error) {
        console.error('Error fetching organizer events:', error);
        return [];
      }

      const mapped = (data || []).map(mapEventRow);
      return includeDrafts ? mapped : mapped.filter((event) => event.status === 'published');
    } catch (error) {
      console.error('Error fetching organizer events:', error);
      return [];
    }
  },

  /**
   * Get a single event by ID
   */
  getEventById: async (id: string): Promise<Event | null> => {
    try {
      const { data, error } = await runEventSingle((select) =>
        supabase.from('events').select(select).eq('id', id)
      );

      if (error) throw error;
      if (!data) return null;

      return mapEventRow(data);
    } catch (error) {
      console.error('Error fetching event by ID:', error);
      return null;
    }
  },

  /**
   * Create a new event in Supabase
   */
  createEvent: async (eventData: any, userId: string): Promise<boolean> => {
    try {
      const defaultCover = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200';
      const address = eventData.location?.address || eventData.address || 'Sin dirección';
      const city = eventData.location?.city || eventData.city || 'Bariloche';
      const latitude = eventData.location?.coordinates?.latitude || toNumber(eventData.latitude, DEFAULT_COORDS.latitude);
      const longitude = eventData.location?.coordinates?.longitude || toNumber(eventData.longitude, DEFAULT_COORDS.longitude);

      const eventRow = {
        title: eventData.title,
        description: eventData.description || '',
        organizer_id: userId,
        category: eventData.category || 'Fiesta Electrónica',
        cover_image: eventData.coverImage || defaultCover,
        address,
        city,
        latitude,
        longitude,
        start_date: eventData.startDate?.toISOString ? eventData.startDate.toISOString() : eventData.startDate,
        end_date: eventData.endDate?.toISOString ? eventData.endDate.toISOString() : eventData.endDate,
        status: 'published',
        is_public: eventData.type !== 'private',
        tags: eventData.tags || [],
        spotify_artist: eventData.spotifyArtist || null,
        spotify_playlist: eventData.spotifyPlaylist || null,
      };

      const insertEvent = async (row: any) =>
        supabase.from('events').insert(row).select('id').single();

      let { data: createdEvent, error } = await insertEvent(eventRow);

      if (error && (isMissingColumn(error, 'address') || isMissingColumn(error, 'latitude'))) {
        const fallbackRow = {
          title: eventRow.title,
          description: eventRow.description,
          organizer_id: eventRow.organizer_id,
          category: eventRow.category,
          cover_image: eventRow.cover_image,
          location_name: eventData.location?.venue || address || city,
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
        };

        const fallbackResult = await insertEvent(fallbackRow);
        createdEvent = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) {
        console.error('Error creating event:', error);
        throw error;
      }

      const eventId = createdEvent?.id;
      const ticketTypes = Array.isArray(eventData.ticketTypes) ? eventData.ticketTypes : [];

      if (eventId && ticketTypes.length > 0) {
        const ticketRows = ticketTypes.map((ticket: any) => ({
          event_id: eventId,
          name: ticket.name,
          price: ticket.price,
          quantity: ticket.quantity,
          available: ticket.available ?? ticket.quantity,
          sale_start_date: eventRow.start_date,
          sale_end_date: eventRow.end_date,
        }));

        const { error: ticketError } = await supabase.from('ticket_types').insert(ticketRows);
        if (ticketError) {
          console.warn('Ticket types insert error:', ticketError);
        }
      }

      return true;
    } catch (error) {
      console.error('CreateEvent Error:', error);
      return false;
    }
  },

  /**
   * Seed database with initial events (For testing)
   */
  seedEvents: async (userId: string) => {
    const eventsToInsert = [
      {
        title: 'Gotham White Party',
        description: 'La mejor fiesta electrónica del verano. Djs invitados y show de luces.',
        organizer_id: userId,
        category: 'Fiesta Electrónica',
        cover_image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=600&auto=format&fit=crop',
        address: 'Av. Bustillo Km 4',
        city: 'Bariloche',
        latitude: -41.135,
        longitude: -71.32,
        start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 2 + 18000000).toISOString(),
        status: 'published',
        is_public: true,
        tags: ['electronica', 'fiesta', 'gotham']
      },
      {
        title: 'Boris Brejcha en el Centro Cívico',
        description: 'El rey del High-Tech Minimal llega al lugar más icónico de la ciudad.',
        organizer_id: userId,
        category: 'Fiesta Electrónica',
        cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
        address: 'Centro Cívico',
        city: 'Bariloche',
        latitude: -41.133472,
        longitude: -71.310278,
        start_date: new Date(Date.now() + 86400000 * 10).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 10 + 21600000).toISOString(),
        status: 'published',
        is_public: true,
        tags: ['boris', 'minimal', 'civico']
      },
      {
        title: 'Hash Fest - Apertura',
        description: 'Cachengue, reggaeton y la mejor onda para bailar hasta el amanecer.',
        organizer_id: userId,
        category: 'Cachengue',
        cover_image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=600&auto=format&fit=crop',
        address: 'Mitre 1200',
        city: 'Bariloche',
        latitude: -41.139,
        longitude: -71.299,
        start_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 5 + 18000000).toISOString(),
        status: 'published',
        is_public: true,
        tags: ['cachengue', 'hash', 'fiesta']
      },
      {
        title: 'Bariloche Baila 2026',
        description: 'El festival de cachengue más grande de la patagonia.',
        organizer_id: userId,
        category: 'Cachengue',
        cover_image: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?q=80&w=600&auto=format&fit=crop',
        address: 'Puerto San Carlos',
        city: 'Bariloche',
        latitude: -41.132,
        longitude: -71.305,
        start_date: new Date(Date.now() + 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 15 + 28800000).toISOString(),
        status: 'published',
        is_public: true,
        tags: ['cachengue', 'festival', 'lago']
      }
    ];

    const insertSeed = async (rows: any[]) => {
      const { error } = await supabase.from('events').insert(rows);
      return error;
    };

    let error = await insertSeed(eventsToInsert);

    if (error && (isMissingColumn(error, 'address') || isMissingColumn(error, 'latitude'))) {
      const fallbackRows = eventsToInsert.map((event) => ({
        title: event.title,
        description: event.description,
        organizer_id: event.organizer_id,
        category: event.category,
        cover_image: event.cover_image,
        location_name: event.address,
        location_address: event.address,
        location_lat: event.latitude,
        location_lng: event.longitude,
        start_date: event.start_date,
        end_date: event.end_date,
        status: event.status,
        is_public: event.is_public,
        tags: event.tags,
      }));

      error = await insertSeed(fallbackRows);
    }

    if (error) {
      console.error('Error seeding events:', error);
      throw error;
    }

    return true;
  }
};
