// Resale/Marketplace types for TiQly - Libre Mercado Edition
// Sin tope de precios - Pure intermediary model

export type ResaleStatus = 'listed' | 'sold' | 'cancelled' | 'expired';
export type OrderStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type RefundStatus = 'none' | 'partial' | 'full';

/**
 * Resale listing - when a user wants to sell their ticket
 */
export interface ResaleListing {
    id: string;
    originalOrderId: string;
    sellerId: string;
    sellerName?: string;
    buyerId?: string;
    buyerName?: string;

    // Precio LIBRE (sin tope)
    askingPrice: number;

    // Desglose de comisiones TiQly
    sellerCommission: number;    // Lo que TiQly le cobra al vendedor (10%)
    buyerServiceFee: number;     // Lo que paga el comprador extra (5%)
    sellerReceives: number;      // askingPrice - sellerCommission
    buyerPays: number;           // askingPrice + buyerServiceFee

    // Estado
    status: ResaleStatus;

    // Timestamps
    listedAt: Date;
    soldAt?: Date;
    expiresAt?: Date;
    cancelledAt?: Date;
    cancellationReason?: string;

    // Event info (populated via join)
    eventId?: string;
    eventTitle?: string;
    eventDate?: Date;
    ticketTypeName?: string;
}

/**
 * Order - a purchased ticket (primary or resale)
 */
export interface Order {
    id: string;
    ticketTypeId: string;
    buyerId: string;

    // Financials
    basePrice: number;
    platformFee: number;
    paymentProcessingFee: number;
    taxAmount: number;
    totalPaid: number;

    // QR/Validation
    qrCode: string;
    verificationCode: string;

    // Usage
    isUsed: boolean;
    usedAt?: Date;
    usedBy?: string;

    // Payment
    paymentStatus: OrderStatus;
    refundStatus: RefundStatus;
    refundAmount: number;
    refundReason?: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentProvider?: string;

    // Resale tracking
    resaleAllowed: boolean;
    isResale: boolean;
    originalOrderId?: string;

    // Timestamps
    purchasedAt: Date;
    expiresAt?: Date;

    // Event info (populated)
    eventTitle?: string;
    eventDate?: Date;
    ticketTypeName?: string;
}

/**
 * Data to create a resale listing
 */
export interface CreateResaleData {
    orderId: string;          // The order (ticket) to resell
    askingPrice: number;      // Price the seller wants
    expiresInDays?: number;   // Optional expiration (default: 30 days)
}

/**
 * Data to purchase a resale listing
 */
export interface PurchaseResaleData {
    listingId: string;
    paymentMethodId?: string;
}

/**
 * Platform configuration for fees
 */
export interface PlatformConfig {
    primaryPlatformFee: number;          // 10%
    resaleSellerCommission: number;      // 10%
    resaleBuyerFee: number;              // 5%
    paymentProcessingFee: number;        // 2.9%
    paymentProcessingFixed: number;      // 0.30 ARS
    payoutMinimum: number;               // 1000 ARS
}
