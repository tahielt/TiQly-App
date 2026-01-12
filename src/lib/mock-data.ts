import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from '../types/event';
import { Ticket } from '../types/ticket';

// Categories for filtering
export const EVENT_CATEGORIES = [
    'Todos',
    'Fiesta Electrónica',
    'Cachengue'
];

// Adapted Mock Events for Mobile
export const MOCK_EVENTS: any[] = [
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
        startDate: new Date('2025-01-20T23:00:00Z'),
        endDate: new Date('2025-01-21T06:00:00Z'),
        price: 25000,
        coverImage: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=800&fit=crop',
        category: 'Fiesta Electrónica',
        tags: ['electronica', 'nightlife', 'verano'],
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't1', name: 'General', price: 25000, quantity: 100, available: 100 }]
    },
    {
        id: '3',
        title: 'Boris Brejcha en el Centro Civico',
        description: 'Boris Brejcha para cerrar Enero.',
        organizerId: 'org_3',
        organizerName: 'Ciclic',
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
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't3', name: 'General', price: 18000, quantity: 500, available: 200 }]
    },
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
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't5', name: 'General', price: 20000, quantity: 50, available: 10 }]
    },
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
        createdAt: new Date(), updatedAt: new Date(), gallery: [],
        ticketTypes: [{ id: 't2', name: 'General', price: 12000, quantity: 300, available: 150 }]
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

        // Merge with mocks if storage is empty (first run) or just return combined
        // For simplicity, let's assume we always want mocks + new ones, 
        // avoiding duplicates if we saved mocks before.
        // A simple strategy: ID check.

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
