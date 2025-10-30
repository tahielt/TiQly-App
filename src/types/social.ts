// Social types for Tiqly App

export interface UserProfile {
  id: string;
  name: string;
  photoURL?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
  eventsAttendedCount: number;
  isFollowing?: boolean;
}

export interface Follow {
  id: string;
  followerId: string;
  followerName: string;
  followingId: string;
  followingName: string;
  createdAt: Date;
}

export interface EventAttendance {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventCover?: string;
  ticketId: string;
  attendedAt: Date; // Cuando se escaneó el ticket
}

// RRPP (Relaciones Públicas) - Usuarios que traen gente a eventos
export interface RRPP {
  id: string;
  userId: string;
  userName: string;
  photoURL?: string;
  organizerId: string;
  eventIds: string[]; // Eventos en los que es RRPP
  commissionRate: number; // Porcentaje de comisión (ej: 0.05 = 5%)
  totalSales: number; // Total vendido
  totalEarnings: number; // Total ganado en comisiones
  createdAt: Date;
  isActive: boolean;
}

export interface RRPPSale {
  id: string;
  rrppId: string;
  rrppName: string;
  ticketId: string;
  eventId: string;
  eventTitle: string;
  buyerId: string;
  buyerName: string;
  ticketPrice: number;
  commissionRate: number;
  commissionAmount: number; // Cuánto ganó el RRPP
  saleDate: Date;
  isPaid: boolean; // Si ya se le pagó al RRPP
}

export interface RRPPCode {
  id: string;
  rrppId: string;
  code: string; // Código único para compartir (ej: "JUAN2024")
  eventId: string;
  uses: number; // Veces que se usó
  createdAt: Date;
}
