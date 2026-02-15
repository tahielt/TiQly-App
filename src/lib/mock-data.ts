import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../types/event';
import { Ticket } from '../types/ticket';

// Categories for filtering
export const EVENT_CATEGORIES = [
    'Todos',
    'Fiesta Electrónica',
    'Cachengue',
    'Rock',
    'Reggaeton',
    'Hip-Hop',
    'Festival',
    'After',
    'Pool Party',
    'Jazz & Blues',
    'Privado'
];

// Adapted Mock Events for Mobile — at least one per category
export const MOCK_EVENTS: any[] = [
    // ── Fiesta Electrónica ──
    {
        id: '1',
        title: 'Gotham White Party',
        description: 'Fiesta electrónica con DJs locales para empezar el verano.',
        organizerId: 'org_1',
        organizerName: 'Electronic Hub',
        type: 'public',
        status: 'published',
        location: {
            address: 'Club del Lago',
            city: 'Bariloche',
            coordinates: { latitude: -41.133472, longitude: -71.310278 }
        },
        startDate: new Date('2026-03-01T23:00:00Z'),
        endDate: new Date('2026-03-02T06:00:00Z'),
        price: 25000,
        coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['electronica', 'nightlife', 'verano'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't1', name: 'General', price: 25000, quantity: 100, available: 100 }]
    },
    {
        id: '3',
        title: 'Boris Brejcha en el Centro Cívico',
        description: 'Boris Brejcha para cerrar Enero.',
        organizerId: 'org_3',
        organizerName: 'Ciclic',
        type: 'public',
        status: 'published',
        location: {
            address: 'Centro Cívico',
            city: 'Bariloche',
            coordinates: { latitude: -41.134000, longitude: -71.308000 }
        },
        startDate: new Date('2026-03-10T00:00:00Z'),
        endDate: new Date('2026-03-10T07:00:00Z'),
        price: 18000,
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['techno', 'dark', 'underground'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't3', name: 'General', price: 18000, quantity: 500, available: 200 }]
    },
    // ── Cachengue ──
    {
        id: '2',
        title: 'Cachengue 2026',
        description: 'Bailamos hasta el amanecer con los mejores hits del momento.',
        organizerId: 'org_2',
        organizerName: 'Bariloche Baila',
        type: 'public',
        status: 'published',
        location: {
            address: 'Puerto Rock',
            city: 'Bariloche',
            coordinates: { latitude: -41.135000, longitude: -71.305000 }
        },
        startDate: new Date('2026-02-28T22:00:00Z'),
        endDate: new Date('2026-03-01T05:00:00Z'),
        price: 12000,
        coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop',
        category: 'Cachengue',
        tags: ['cachengue', 'fiesta', 'amigos'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't2', name: 'General', price: 12000, quantity: 300, available: 150 }]
    },
    // ── Rock ──
    {
        id: '6',
        title: 'Tributo a Soda Stereo',
        description: 'Los clásicos del rock nacional en vivo. Vení a cantar todo.',
        organizerId: 'org_4',
        organizerName: 'Rock Patagónico',
        type: 'public',
        status: 'published',
        location: {
            address: 'Anfiteatro del Lago',
            city: 'Bariloche',
            coordinates: { latitude: -41.137500, longitude: -71.302000 }
        },
        startDate: new Date('2026-03-05T21:00:00Z'),
        endDate: new Date('2026-03-06T01:00:00Z'),
        price: 15000,
        coverImage: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=1200&h=800&fit=crop',
        category: 'Rock',
        tags: ['rock', 'tributo', 'soda'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't6', name: 'General', price: 15000, quantity: 200, available: 120 }]
    },
    // ── Reggaeton ──
    {
        id: '7',
        title: 'Perreo Intenso',
        description: 'Los hits de Bad Bunny, Feid, Karol G y más. No pares!',
        organizerId: 'org_2',
        organizerName: 'Fiesta BRC',
        type: 'public',
        status: 'published',
        location: {
            address: 'Discoteca Roura',
            city: 'Bariloche',
            coordinates: { latitude: -41.131800, longitude: -71.311200 }
        },
        startDate: new Date('2026-03-08T23:30:00Z'),
        endDate: new Date('2026-03-09T05:00:00Z'),
        price: 10000,
        coverImage: 'https://images.unsplash.com/photo-1571266028243-3716f02d2d2e?w=1200&h=800&fit=crop',
        category: 'Reggaeton',
        tags: ['reggaeton', 'perreo', 'latina'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't7', name: 'General', price: 10000, quantity: 250, available: 200 }]
    },
    // ── Hip-Hop ──
    {
        id: '8',
        title: 'Freestyle Battle Night',
        description: 'Los mejores MCs de la Patagonia se enfrentan. Beats en vivo.',
        organizerId: 'org_5',
        organizerName: 'HipHop Sur',
        type: 'public',
        status: 'published',
        location: {
            address: 'Centro Cultural El Bolsón',
            city: 'Bariloche',
            coordinates: { latitude: -41.136200, longitude: -71.307500 }
        },
        startDate: new Date('2026-03-12T20:00:00Z'),
        endDate: new Date('2026-03-13T00:00:00Z'),
        price: 8000,
        coverImage: 'https://images.unsplash.com/photo-1547355253-ff0740f6e8c1?w=1200&h=800&fit=crop',
        category: 'Hip-Hop',
        tags: ['hiphop', 'freestyle', 'rap'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't8', name: 'General', price: 8000, quantity: 150, available: 130 }]
    },
    // ── Festival ──
    {
        id: '9',
        title: 'Patagonia Music Fest 2026',
        description: '3 escenarios, 20 artistas, 12 horas de música al pie de la montaña.',
        organizerId: 'org_1',
        organizerName: 'Electronic Hub',
        type: 'public',
        status: 'published',
        location: {
            address: 'Cerro Catedral Base',
            city: 'Bariloche',
            coordinates: { latitude: -41.166000, longitude: -71.440000 }
        },
        startDate: new Date('2026-03-15T14:00:00Z'),
        endDate: new Date('2026-03-16T04:00:00Z'),
        price: 35000,
        coverImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=800&fit=crop',
        category: 'Festival',
        tags: ['festival', 'montaña', 'music'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [
            { id: 't9a', name: 'Early Bird', price: 35000, quantity: 500, available: 100 },
            { id: 't9b', name: 'General', price: 45000, quantity: 1000, available: 800 },
            { id: 't9c', name: 'VIP', price: 80000, quantity: 100, available: 60 }
        ]
    },
    // ── After ──
    {
        id: '10',
        title: 'After Hours — Sunrise Set',
        description: 'De 5AM a 12PM. Minimal techno con vista al lago Nahuel Huapi.',
        organizerId: 'org_3',
        organizerName: 'Ciclic',
        type: 'public',
        status: 'published',
        location: {
            address: 'Bahía Serena',
            city: 'Bariloche',
            coordinates: { latitude: -41.130000, longitude: -71.315000 }
        },
        startDate: new Date('2026-03-02T05:00:00Z'),
        endDate: new Date('2026-03-02T12:00:00Z'),
        price: 20000,
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop',
        category: 'After',
        tags: ['after', 'sunrise', 'minimal'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't10', name: 'General', price: 20000, quantity: 80, available: 30 }]
    },
    // ── Pool Party ──
    {
        id: '11',
        title: 'Summer Splash — Pool Party',
        description: 'Pileta climatizada, DJs, cocktails y el mejor vibe del verano.',
        organizerId: 'org_1',
        organizerName: 'Electronic Hub',
        type: 'public',
        status: 'published',
        location: {
            address: 'Hotel Llao Llao',
            city: 'Bariloche',
            coordinates: { latitude: -41.058000, longitude: -71.530000 }
        },
        startDate: new Date('2026-02-22T15:00:00Z'),
        endDate: new Date('2026-02-22T22:00:00Z'),
        price: 30000,
        coverImage: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&h=800&fit=crop',
        category: 'Pool Party',
        tags: ['pool', 'summer', 'drinks'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [
            { id: 't11a', name: 'General', price: 30000, quantity: 100, available: 40 },
            { id: 't11b', name: 'VIP + Barra Libre', price: 55000, quantity: 30, available: 15 }
        ]
    },
    // ── Jazz & Blues ──
    {
        id: '12',
        title: 'Jazz en el Bosque',
        description: 'Noche de jazz acústico con vino y fuego. Artistas locales e invitados.',
        organizerId: 'org_6',
        organizerName: 'Jazz Patagonia',
        type: 'public',
        status: 'published',
        location: {
            address: 'Colonia Suiza',
            city: 'Bariloche',
            coordinates: { latitude: -41.084000, longitude: -71.498000 }
        },
        startDate: new Date('2026-03-07T20:00:00Z'),
        endDate: new Date('2026-03-08T00:00:00Z'),
        price: 12000,
        coverImage: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&h=800&fit=crop',
        category: 'Jazz & Blues',
        tags: ['jazz', 'blues', 'acustico'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't12', name: 'Mesa', price: 12000, quantity: 40, available: 25 }]
    },
    // ── Privado ──
    {
        id: '13',
        title: 'Exclusive Night — Solo Invitados',
        description: 'Evento privado. Ubicación revelada solo a confirmados.',
        organizerId: 'org_1',
        organizerName: 'Private Party',
        type: 'private',
        status: 'published',
        location: {
            address: 'Dirección privada',
            city: 'Bariloche',
            coordinates: { latitude: -41.140000, longitude: -71.300000 }
        },
        startDate: new Date('2026-03-20T22:00:00Z'),
        endDate: new Date('2026-03-21T04:00:00Z'),
        price: 50000,
        coverImage: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=1200&h=800&fit=crop',
        category: 'Privado',
        tags: ['privado', 'exclusivo', 'vip'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't13', name: 'Invitación', price: 50000, quantity: 30, available: 5 }]
    }
];

export const MOCK_USER = {
    id: 'user_demo',
    email: 'demo@tiqly.com',
    name: 'Usuario de Prueba',
    roles: ['attendee'],
    activeRole: 'attendee',
    token: 'mock-token-123'
};

const STORAGE_KEYS = {
    USER: 'tiqly_user',
    EVENTS: 'tiqly_events',
    TICKETS: 'tiqly_tickets'
};

// --- Helpers ---

export const getEvents = async (): Promise<any[]> => {
    try {
        const storedEventsStr = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
        let storedEvents = storedEventsStr ? JSON.parse(storedEventsStr) : [];

        const allEvents = [...MOCK_EVENTS, ...storedEvents];
        // Deduplicate by ID
        const uniqueEvents = Array.from(new Map(allEvents.map(item => [item.id, item])).values());

        return uniqueEvents;
    } catch (e) {
        console.error("Error fetching events", e);
        return MOCK_EVENTS;
    }
};

export const getEventById = async (id: string) => {
    const events = await getEvents();
    return events.find(e => e.id === id);
};

export const saveEvent = async (event: any) => {
    try {
        const storedEventsStr = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
        const storedEvents = storedEventsStr ? JSON.parse(storedEventsStr) : [];

        storedEvents.push(event);
        await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(storedEvents));
        return true;
    } catch (e) {
        console.error("Error saving event", e);
        return false;
    }
};

export const getUser = async () => {
    try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        return jsonValue != null ? JSON.parse(jsonValue) : MOCK_USER;
    } catch (e) {
        return null;
    }
};

export const saveTicket = async (ticket: any) => {
    try {
        const existingTicketsStr = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
        const existingTickets = existingTicketsStr ? JSON.parse(existingTicketsStr) : [];
        existingTickets.push(ticket);
        await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(existingTickets));
        return true;
    } catch (e) {
        return false;
    }
};

export const getMyTickets = async () => {
    try {
        const existingTicketsStr = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
        return existingTicketsStr ? JSON.parse(existingTicketsStr) : [];
    } catch (e) {
        return [];
    }
};

// 🗑️ Clear all purchased tickets (for testing)
export const clearMyTickets = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.TICKETS);
        return true;
    } catch (e) {
        console.error("Error clearing tickets", e);
        return false;
    }
};

// 🗑️ Clear all user-created events (keeps mock events)
export const clearMyEvents = async () => {
    try {
        await AsyncStorage.removeItem(STORAGE_KEYS.EVENTS);
        return true;
    } catch (e) {
        console.error("Error clearing events", e);
        return false;
    }
};

// 🗑️ Clear ALL test data (tickets + events)
export const clearAllTestData = async () => {
    try {
        await AsyncStorage.multiRemove([STORAGE_KEYS.TICKETS, STORAGE_KEYS.EVENTS]);
        return true;
    } catch (e) {
        console.error("Error clearing test data", e);
        return false;
    }
};
