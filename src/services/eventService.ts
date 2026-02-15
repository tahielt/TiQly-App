import { supabase } from '../lib/supabase';
import { Event, EventStatus, EventType } from '../types/event';

export const eventService = {
  /**
   * Fetch all published events from Supabase
   */
  getEvents: async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id (
             name
          )
        `)
        .eq('status', 'published');

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      if (!data) return [];

      // Map Supabase rows to App Event interface
      return data.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        organizerId: row.organizer_id,
        organizerName: row.organizer?.name || 'Organizador',
        type: row.is_public ? 'public' : 'private',
        status: row.status || 'published',
        location: {
          address: row.address || '',
          city: row.city || '',
          coordinates: {
            latitude: parseFloat(row.latitude) || -41.133,
            longitude: parseFloat(row.longitude) || -71.310
          }
        },
        startDate: new Date(row.start_date),
        endDate: row.end_date ? new Date(row.end_date) : new Date(row.start_date),
        coverImage: row.cover_image,
        gallery: row.gallery || [],
        price: row.price || 0,
        ticketTypes: [],
        attendeeCount: 0,
        maxAttendees: undefined,
        tags: row.tags || [],
        category: row.category || 'Fiesta Electrónica',
        spotifyArtist: row.spotify_artist || null,
        spotifyPlaylist: row.spotify_playlist || null,
        ageRestriction: undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));
    } catch (error) {
      console.error('EventService Error:', error);
      return [];
    }
  },

  /**
   * Get a single event by ID
   */
  getEventById: async (id: string): Promise<Event | null> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!organizer_id (
             name
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return null;

      const row = data;
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        organizerId: row.organizer_id,
        organizerName: row.organizer?.name || 'Organizador',
        type: row.is_public ? 'public' : 'private',
        status: row.status || 'published',
        location: {
          address: row.address || '',
          city: row.city || '',
          coordinates: {
            latitude: parseFloat(row.latitude) || -41.133,
            longitude: parseFloat(row.longitude) || -71.310
          }
        },
        startDate: new Date(row.start_date),
        endDate: row.end_date ? new Date(row.end_date) : new Date(row.start_date),
        coverImage: row.cover_image,
        gallery: row.gallery || [],
        price: row.price || 0,
        ticketTypes: [],
        attendeeCount: 0,
        maxAttendees: undefined,
        tags: row.tags || [],
        category: row.category || 'Fiesta Electrónica',
        spotifyArtist: row.spotify_artist || null,
        spotifyPlaylist: row.spotify_playlist || null,
        ageRestriction: undefined,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };
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
      const eventRow = {
        title: eventData.title,
        description: eventData.description || '',
        organizer_id: userId,
        category: eventData.category || 'Fiesta Electrónica',
        cover_image: eventData.coverImage || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200',
        address: eventData.location?.address || eventData.address || 'Sin dirección',
        city: eventData.location?.city || eventData.city || 'Bariloche',
        latitude: eventData.location?.coordinates?.latitude || parseFloat(eventData.latitude) || -41.133,
        longitude: eventData.location?.coordinates?.longitude || parseFloat(eventData.longitude) || -71.310,
        start_date: eventData.startDate?.toISOString ? eventData.startDate.toISOString() : eventData.startDate,
        end_date: eventData.endDate?.toISOString ? eventData.endDate.toISOString() : eventData.endDate,
        status: 'published',
        is_public: eventData.type !== 'private',
        tags: eventData.tags || [],
        spotify_artist: eventData.spotifyArtist || null,
        spotify_playlist: eventData.spotifyPlaylist || null,
      };

      const { error } = await supabase.from('events').insert(eventRow);

      if (error) {
        console.error('Error creating event:', error);
        throw error;
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
        description: 'La mejor fiesta electrónica del verano.',
        organizer_id: userId,
        category: 'Fiesta Electrónica',
        cover_image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=600&auto=format&fit=crop',
        address: 'Av. Bustillo Km 4', city: 'Bariloche',
        latitude: -41.135, longitude: -71.320,
        start_date: new Date(Date.now() + 86400000 * 2).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 2 + 18000000).toISOString(),
        status: 'published', is_public: true,
        tags: ['electronica', 'fiesta', 'gotham']
      },
      {
        title: 'Boris Brejcha en el Centro Cívico',
        description: 'High-Tech Minimal en el lugar más icónico.',
        organizer_id: userId,
        category: 'Fiesta Electrónica',
        cover_image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&auto=format&fit=crop',
        address: 'Centro Cívico', city: 'Bariloche',
        latitude: -41.133472, longitude: -71.310278,
        start_date: new Date(Date.now() + 86400000 * 10).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 10 + 21600000).toISOString(),
        status: 'published', is_public: true,
        tags: ['boris', 'minimal', 'civico']
      },
      {
        title: 'Hash Fest - Apertura',
        description: 'Cachengue y reggaeton hasta el amanecer.',
        organizer_id: userId,
        category: 'Cachengue',
        cover_image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=600&auto=format&fit=crop',
        address: 'Mitre 1200', city: 'Bariloche',
        latitude: -41.139, longitude: -71.299,
        start_date: new Date(Date.now() + 86400000 * 5).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 5 + 18000000).toISOString(),
        status: 'published', is_public: true,
        tags: ['cachengue', 'hash', 'fiesta']
      },
      {
        title: 'Tributo a Soda Stereo',
        description: 'Los clásicos del rock nacional en vivo.',
        organizer_id: userId,
        category: 'Rock',
        cover_image: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?q=80&w=600&auto=format&fit=crop',
        address: 'Anfiteatro del Lago', city: 'Bariloche',
        latitude: -41.1375, longitude: -71.302,
        start_date: new Date(Date.now() + 86400000 * 7).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 7 + 14400000).toISOString(),
        status: 'published', is_public: true,
        tags: ['rock', 'tributo', 'soda']
      },
      {
        title: 'Perreo Intenso',
        description: 'Bad Bunny, Feid, Karol G y más.',
        organizer_id: userId,
        category: 'Reggaeton',
        cover_image: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?q=80&w=600&auto=format&fit=crop',
        address: 'Discoteca Roura', city: 'Bariloche',
        latitude: -41.1318, longitude: -71.3112,
        start_date: new Date(Date.now() + 86400000 * 8).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 8 + 18000000).toISOString(),
        status: 'published', is_public: true,
        tags: ['reggaeton', 'perreo', 'latina']
      },
      {
        title: 'Freestyle Battle Night',
        description: 'MCs de la Patagonia. Beats en vivo.',
        organizer_id: userId,
        category: 'Hip-Hop',
        cover_image: 'https://images.unsplash.com/photo-1547355253-ff0740f6e8c1?q=80&w=600&auto=format&fit=crop',
        address: 'Centro Cultural', city: 'Bariloche',
        latitude: -41.1362, longitude: -71.3075,
        start_date: new Date(Date.now() + 86400000 * 12).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 12 + 14400000).toISOString(),
        status: 'published', is_public: true,
        tags: ['hiphop', 'freestyle', 'rap']
      },
      {
        title: 'Patagonia Music Fest 2026',
        description: '3 escenarios, 20 artistas, 12 horas.',
        organizer_id: userId,
        category: 'Festival',
        cover_image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
        address: 'Cerro Catedral Base', city: 'Bariloche',
        latitude: -41.166, longitude: -71.440,
        start_date: new Date(Date.now() + 86400000 * 15).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 15 + 43200000).toISOString(),
        status: 'published', is_public: true,
        tags: ['festival', 'montaña', 'music']
      },
      {
        title: 'After Hours — Sunrise Set',
        description: 'Minimal techno con vista al lago.',
        organizer_id: userId,
        category: 'After',
        cover_image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
        address: 'Bahía Serena', city: 'Bariloche',
        latitude: -41.130, longitude: -71.315,
        start_date: new Date(Date.now() + 86400000 * 3).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 3 + 25200000).toISOString(),
        status: 'published', is_public: true,
        tags: ['after', 'sunrise', 'minimal']
      },
      {
        title: 'Summer Splash — Pool Party',
        description: 'Pileta, DJs, cocktails.',
        organizer_id: userId,
        category: 'Pool Party',
        cover_image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?q=80&w=600&auto=format&fit=crop',
        address: 'Hotel Llao Llao', city: 'Bariloche',
        latitude: -41.058, longitude: -71.530,
        start_date: new Date(Date.now() + 86400000 * 6).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 6 + 25200000).toISOString(),
        status: 'published', is_public: true,
        tags: ['pool', 'summer', 'drinks']
      },
      {
        title: 'Jazz en el Bosque',
        description: 'Jazz acústico con vino y fuego.',
        organizer_id: userId,
        category: 'Jazz & Blues',
        cover_image: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600&auto=format&fit=crop',
        address: 'Colonia Suiza', city: 'Bariloche',
        latitude: -41.084, longitude: -71.498,
        start_date: new Date(Date.now() + 86400000 * 9).toISOString(),
        end_date: new Date(Date.now() + 86400000 * 9 + 14400000).toISOString(),
        status: 'published', is_public: true,
        tags: ['jazz', 'blues', 'acustico']
      }
    ];

    const { error } = await supabase.from('events').insert(eventsToInsert);

    if (error) {
      console.error('Error seeding events:', error);
      throw error;
    }

    return true;
  }
};
