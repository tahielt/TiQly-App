// Resale marketplace types for TiQly

export type ResaleStatus = 'listed' | 'sold' | 'cancelled' | 'expired';

export interface ResaleListing {
  id: string;
  ticketId: string;
  sellerId: string;
  sellerName?: string;
  buyerId?: string;
  buyerName?: string;
  askingPrice: number;
  originalPrice: number;
  platformFee: number;
  sellerReceives: number;
  buyerPays: number;
  status: ResaleStatus;
  listedAt: Date;
  soldAt?: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  eventId?: string;
  eventTitle?: string;
  eventDate?: Date;
  ticketTypeName?: string;
}

export interface CreateResaleData {
  ticketId: string;
  askingPrice: number;
  expiresInDays?: number;
}

export interface PurchaseResaleData {
  listingId: string;
  paymentMethodId?: string;
}

export interface PlatformConfig {
  primaryFeePct: number;
  resaleFeePct: number;
  publishFee: number;
}
