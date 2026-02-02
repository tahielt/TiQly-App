/**
 * TiQly Dashboard Types
 * Types for the Organizer "Dopamine" Dashboard
 */

export interface HypeIndexData {
    basePrice: number;
    averageAskingPrice: number;
    multiplier: number;
    trendDirection: 'up' | 'down' | 'stable';
}

export interface OrganizerRevenue {
    grossRevenue: number;
    netProfit: number;
    platformFee: number;
    resaleVolume: number;
    lastUpdated: Date;
}

export interface DashboardStats {
    totalSales: number;
    activeListings: number;
    highDemandCount: number;
    hypeIndex: HypeIndexData;
    revenue: OrganizerRevenue;
}

export interface ResaleListing {
    id: string;
    ticketId: string;
    eventTitle: string;
    eventDate: Date;
    eventImage?: string;
    ticketTier: string;
    originalPrice: number;
    askingPrice: number;
    sellerName: string;
    status: 'active' | 'sold' | 'cancelled' | 'expired';
    createdAt: Date;
    isHighDemand: boolean; // asking_price > 2x original_price
}

export interface SaleTransaction {
    id: string;
    buyerName: string;
    ticketTier: string;
    originalPrice: number;
    salePrice: number;
    platformFee: number;
    netRevenue: number;
    soldAt: Date;
    isResale: boolean;
}
