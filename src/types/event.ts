// Event types for Tiqly App

export type EventType = 'public' | 'private';
export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export interface EventLocation {
  address: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  venue?: string;
}

export interface EventTicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  available: number;
  saleStartDate: Date;
  saleEndDate: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizerName: string;
  type: EventType;
  status: EventStatus;
  location: EventLocation;
  startDate: Date;
  endDate: Date;
  coverImage?: string;
  price?: number;
  gallery: string[];
  ticketTypes: EventTicketType[];
  attendeeCount: number;
  maxAttendees?: number;
  tags: string[];
  category: string;
  spotifyArtist?: string | null;
  spotifyPlaylist?: string | null;
  ageRestriction?: number;
  // Para eventos privados/exclusivos
  invitedUsers?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EventComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  images: string[];
  createdAt: Date;
}

export interface EventFilter {
  search?: string;
  type?: EventType[];
  category?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  priceMin?: number;
  priceMax?: number;
  location?: {
    latitude: number;
    longitude: number;
    radius: number; // in km
  };
  tags?: string[];
}
