export type EventStatus = 'published' | 'draft' | 'cancelled';
export type EventType = 'public' | 'private';

export interface Location {
    address: string;
    city: string;
    name?: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
}

export interface Event {
    id: string;
    title: string;
    description: string;
    organizerId: string;
    organizerName: string;
    organizerStripeId?: string; // New field for Payment integration
    createdByUserId?: string; // User who created this event (for Mis Eventos)
    type: EventType;
    status: EventStatus;
    location: Location;
    startDate: Date;
    endDate: Date;
    price: number;
    coverImage: string;
    category: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    gallery: string[];
}
