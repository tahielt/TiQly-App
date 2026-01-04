
import { Event, EventStatus, EventType } from '@/types/event';
import { Ticket, TicketStatus } from '@/types/ticket';

// Categories for filtering
export const EVENT_CATEGORIES = [
    'Todos',
    'Fiesta Electrónica',
    'Cachengue',
    'Concierto',
    'Festival',
    'Teatro',
    'Deportes'
];

export const MOCK_EVENTS: Event[] = [
    // --- FIESTA ELECTRÓNICA (4 Events) ---
    {
        id: '1',
        title: 'Gotham White Party',
        description: 'Fiesta electrónica con DJs locales para empezar el verano.',
        organizerId: 'org_1',
        organizerName: 'Electronic Hub',
        createdByUserId: 'user_demo', // Demo user owns this
        type: 'public',
        status: 'published',
        location: {
            address: 'Club del Lago',
            city: 'Bariloche',
            name: 'Club del Lago',
            coordinates: { latitude: -41.133472, longitude: -71.310278 }
        },
        startDate: new Date('2025-01-20T23:00:00Z'),
        endDate: new Date('2025-01-21T06:00:00Z'),
        price: 25000,
        coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['electronica', 'nightlife', 'verano'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,
    {
        id: '3',
        title: 'Boris Brejcha en el Centro Civico',
        description: 'Boris Brejcha para cerrar Enero.',
        organizerId: 'org_3',
        organizerName: 'Ciclic',
        createdByUserId: 'user_demo',
        type: 'public',
        status: 'published',
        location: {
            address: 'Centro Civico',
            city: 'Bariloche',
            coordinates: { latitude: -41.134000, longitude: -71.308000 }
        },
        startDate: new Date('2025-02-01T00:00:00Z'),
        endDate: new Date('2025-02-01T07:00:00Z'),
        price: 18000,
        coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['techno', 'dark', 'underground'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,
    {
        id: '5',
        title: 'Sunset en Berkana',
        description: 'Música house al atardecer en la terraza del hotel.',
        organizerId: 'org_1',
        organizerName: 'Electronic Hub',
        type: 'public',
        status: 'published',
        location: {
            address: 'Hotel Berkana',
            city: 'Bariloche',
            coordinates: { latitude: -41.133000, longitude: -71.310000 }
        },
        startDate: new Date('2025-02-15T18:00:00Z'),
        endDate: new Date('2025-02-16T00:00:00Z'),
        price: 20000,
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['house', 'sunset', 'drinks'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,
    {
        id: '6',
        title: 'Rave en Localización Secreta',
        description: 'Una experiencia sensorial única en el bosque.',
        organizerId: 'org_3',
        organizerName: 'Nature Sounds',
        type: 'public',
        status: 'published',
        location: {
            address: 'Localización Secreta',
            city: 'Bariloche',
            coordinates: { latitude: -41.140000, longitude: -71.350000 }
        },
        startDate: new Date('2025-03-01T22:00:00Z'),
        endDate: new Date('2025-03-02T06:00:00Z'),
        price: 30000,
        coverImage: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['rave', 'nature', 'psytrance'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,

    // --- CACHENGUE (4 Events) ---
    {
        id: '2',
        title: 'Cachengue 2025',
        description: 'Bailamos hasta el amanecer con los mejores hits del momento.',
        organizerId: 'org_2',
        organizerName: 'Fiesta BRC',
        type: 'public',
        status: 'published',
        location: {
            address: 'Puerto Rock',
            city: 'Bariloche',
            coordinates: { latitude: -41.135000, longitude: -71.305000 }
        },
        startDate: new Date('2025-01-25T22:00:00Z'),
        endDate: new Date('2025-01-26T05:00:00Z'),
        price: 12000,
        coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop',
        category: 'Cachengue',
        tags: ['cachengue', 'fiesta', 'amigos'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,
    {
        id: '4',
        title: 'Reggaeton Old School',
        description: 'Vuelve el perreo de antes. Solo clásicos toda la noche.',
        organizerId: 'org_2',
        organizerName: 'Fiesta BRC',
        type: 'public',
        status: 'published',
        location: {
            address: 'By Pass',
            city: 'Bariloche',
            coordinates: { latitude: -41.132000, longitude: -71.311000 }
        },
        startDate: new Date('2025-02-14T23:30:00Z'),
        endDate: new Date('2025-02-15T05:30:00Z'),
        price: 15000,
        coverImage: 'https://images.unsplash.com/photo-1504680177321-2e6a879aac86?w=1200&h=800&fit=crop',
        category: 'Cachengue',
        tags: ['reggaeton', 'cachengue', 'night'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,
    {
        id: '7',
        title: 'Noche de Cumbia',
        description: 'Los mejores grupos de cumbia en vivo.',
        organizerId: 'org_4',
        organizerName: 'Cumbia Live',
        type: 'public',
        status: 'published',
        location: {
            address: 'Gimnasio Municipal',
            city: 'Bariloche',
            coordinates: { latitude: -41.145000, longitude: -71.300000 }
        },
        startDate: new Date('2025-02-20T21:00:00Z'),
        endDate: new Date('2025-02-21T04:00:00Z'),
        price: 10000,
        coverImage: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200&h=800&fit=crop',
        category: 'Cachengue',
        tags: ['cumbia', 'envivo', 'popular'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event,
    {
        id: '8',
        title: 'Fiesta de la Espuma',
        description: 'La clásica fiesta de la espuma para cerrar el verano.',
        organizerId: 'org_2',
        organizerName: 'Fiesta BRC',
        type: 'public',
        status: 'published',
        location: {
            address: 'Cerebro',
            city: 'Bariloche',
            coordinates: { latitude: -41.134500, longitude: -71.312000 }
        },
        startDate: new Date('2025-03-10T23:00:00Z'),
        endDate: new Date('2025-03-11T05:00:00Z'),
        price: 22000,
        coverImage: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&h=800&fit=crop',
        category: 'Cachengue',
        tags: ['espuma', 'verano', 'fiesta'],
        createdAt: new Date(), updatedAt: new Date(), gallery: []
    } as unknown as Event
];

// Mock User
export const MOCK_USER = {
    id: 'user_demo',
    name: 'Demo User',
    email: 'demo@tiqly.com',
    avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=D4FF00&color=000'
};

// ============================================
// LocalStorage Helpers
// ============================================

const STORAGE_KEYS = {
    USER: 'tiqly_user',
    EVENTS: 'tiqly_events',
    TICKETS: 'tiqly_tickets'
};

// User helpers
export const getUserFromStorage = (): typeof MOCK_USER | null => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEYS.USER);
    return stored ? JSON.parse(stored) : null;
};

export const saveUserToStorage = (user: typeof MOCK_USER): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
};

export const clearUserFromStorage = (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.USER);
};

// Events helpers
export const getStoredEvents = (): Event[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!stored) return [];
    try {
        const events = JSON.parse(stored);
        // Convert date strings back to Date objects
        return events.map((e: Event) => ({
            ...e,
            startDate: new Date(e.startDate),
            endDate: new Date(e.endDate),
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt)
        }));
    } catch {
        return [];
    }
};

export const saveEventToStorage = (event: Event): void => {
    if (typeof window === 'undefined') return;
    const existing = getStoredEvents();
    existing.push(event);
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(existing));
};

export const getAllEvents = (): Event[] => {
    const storedEvents = getStoredEvents();
    // Merge mock events with stored events, avoiding duplicates by ID
    const allIds = new Set(MOCK_EVENTS.map(e => e.id));
    const uniqueStored = storedEvents.filter(e => !allIds.has(e.id));
    return [...MOCK_EVENTS, ...uniqueStored];
};

export const getEventById = (id: string): Event | undefined => {
    return getAllEvents().find(e => e.id === id);
};

export const getEventsByUser = (userId: string): Event[] => {
    return getAllEvents().filter(e => e.createdByUserId === userId);
};

// Tickets helpers
export const getStoredTickets = (): Ticket[] => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!stored) return [];
    try {
        const tickets = JSON.parse(stored);
        return tickets.map((t: Ticket) => ({
            ...t,
            eventDate: new Date(t.eventDate),
            purchaseDate: new Date(t.purchaseDate),
            createdAt: new Date(t.createdAt),
            updatedAt: new Date(t.updatedAt)
        }));
    } catch {
        return [];
    }
};

export const saveTicketToStorage = (ticket: Ticket): void => {
    if (typeof window === 'undefined') return;
    const existing = getStoredTickets();
    existing.push(ticket);
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(existing));
};

export const getTicketsByUser = (userId: string): Ticket[] => {
    return getStoredTickets().filter(t => t.userId === userId);
};

// ============================================
// Purchase Flow
// ============================================

export interface PurchaseResult {
    success: boolean;
    ticket?: Ticket;
    paymentDetails?: {
        total: number;
        platformFee: number;
        stripeFee: number;
        organizerNet: number;
    };
    message: string;
}

export const purchaseTicket = (eventId: string, userId: string, userName: string, userEmail: string): PurchaseResult => {
    const event = getEventById(eventId);
    if (!event) {
        return { success: false, message: 'Evento no encontrado' };
    }

    const price = event.price;
    const platformFee = Math.round(price * 0.15);
    const stripeFee = Math.round(price * 0.03);
    const organizerNet = price - platformFee - stripeFee;

    const newTicket: Ticket = {
        id: `ticket_${Date.now()}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.startDate,
        eventLocation: event.location.address,
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        ticketTypeId: 'general',
        ticketTypeName: 'Entrada General',
        price: event.price,
        qrCode: `QR-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`,
        status: 'active',
        purchaseDate: new Date(),
        transferHistory: [],
        originalOwnerId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    saveTicketToStorage(newTicket);

    return {
        success: true,
        ticket: newTicket,
        message: '¡Compra exitosa!',
        paymentDetails: {
            total: price,
            platformFee,
            stripeFee,
            organizerNet
        }
    };
};

// Generate unique ID for new events
export const generateEventId = (): string => {
    return `event_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};
