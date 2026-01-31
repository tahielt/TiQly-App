/**
 * TiQly Resale Marketplace Service
 * Libre Mercado Edition - Sin tope de precios
 * 
 * Commissions:
 * - Seller pays: 10% of asking price
 * - Buyer pays: asking price + 5% service fee
 */

import { supabase } from '../lib/supabase';
import {
    ResaleListing,
    CreateResaleData,
    PurchaseResaleData,
    PlatformConfig
} from '../types/resale';
import * as Crypto from 'expo-crypto';

// Default commission rates
const SELLER_COMMISSION_RATE = 0.10;  // 10%
const BUYER_SERVICE_FEE_RATE = 0.05;  // 5%

/**
 * Calculate resale fees and amounts
 */
export const calculateResaleFees = (askingPrice: number) => {
    const sellerCommission = Math.round(askingPrice * SELLER_COMMISSION_RATE * 100) / 100;
    const buyerServiceFee = Math.round(askingPrice * BUYER_SERVICE_FEE_RATE * 100) / 100;
    const sellerReceives = askingPrice - sellerCommission;
    const buyerPays = askingPrice + buyerServiceFee;

    return {
        askingPrice,
        sellerCommission,
        buyerServiceFee,
        sellerReceives,
        buyerPays,
        tiQlyTotal: sellerCommission + buyerServiceFee // Total TiQly revenue
    };
};

/**
 * Create a resale listing
 */
export const createResaleListing = async (
    data: CreateResaleData,
    sellerId: string
): Promise<ResaleListing> => {
    // Validate: Check the order exists and belongs to seller
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, resale_allowed, is_used, payment_status')
        .eq('id', data.orderId)
        .eq('buyer_id', sellerId)
        .single();

    if (orderError || !order) {
        throw new Error('Orden no encontrada o no te pertenece');
    }

    if (!order.resale_allowed) {
        throw new Error('Este ticket no permite reventa');
    }

    if (order.is_used) {
        throw new Error('No podés revender un ticket ya usado');
    }

    if (order.payment_status !== 'completed') {
        throw new Error('Solo podés revender tickets pagados');
    }

    // Check not already listed
    const { data: existing } = await supabase
        .from('resales')
        .select('id')
        .eq('original_order_id', data.orderId)
        .eq('status', 'listed')
        .single();

    if (existing) {
        throw new Error('Este ticket ya está en venta');
    }

    // Calculate fees
    const fees = calculateResaleFees(data.askingPrice);

    // Set expiration
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30));

    // Create listing
    const { data: listing, error } = await supabase
        .from('resales')
        .insert({
            original_order_id: data.orderId,
            seller_id: sellerId,
            asking_price: fees.askingPrice,
            seller_commission: fees.sellerCommission,
            buyer_service_fee: fees.buyerServiceFee,
            seller_receives: fees.sellerReceives,
            buyer_pays: fees.buyerPays,
            status: 'listed',
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating resale listing:', error);
        throw new Error('Error al crear la publicación');
    }

    return mapResaleListing(listing);
};

/**
 * Get all active resale listings for an event
 */
export const getEventResales = async (eventId: string): Promise<ResaleListing[]> => {
    const { data, error } = await supabase
        .from('resales')
        .select(`
      *,
      order:orders!original_order_id (
        ticket_type:ticket_types!ticket_type_id (
          name,
          event:events!event_id (
            id,
            title,
            start_date
          )
        )
      ),
      seller:profiles!seller_id (
        name
      )
    `)
        .eq('status', 'listed')
        .order('asking_price', { ascending: true });

    if (error) {
        console.error('Error fetching resales:', error);
        return [];
    }

    // Filter by event
    return (data || [])
        .filter((r: any) => r.order?.ticket_type?.event?.id === eventId)
        .map(mapResaleListingWithEvent);
};

/**
 * Get user's resale listings (as seller)
 */
export const getUserListings = async (userId: string): Promise<ResaleListing[]> => {
    const { data, error } = await supabase
        .from('resales')
        .select(`
      *,
      order:orders!original_order_id (
        ticket_type:ticket_types!ticket_type_id (
          name,
          event:events!event_id (
            id,
            title,
            start_date
          )
        )
      )
    `)
        .eq('seller_id', userId)
        .order('listed_at', { ascending: false });

    if (error) {
        console.error('Error fetching user listings:', error);
        return [];
    }

    return (data || []).map(mapResaleListingWithEvent);
};

/**
 * Cancel a resale listing
 */
export const cancelResaleListing = async (
    listingId: string,
    sellerId: string,
    reason?: string
): Promise<void> => {
    const { error } = await supabase
        .from('resales')
        .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            cancellation_reason: reason || 'Cancelled by seller'
        })
        .eq('id', listingId)
        .eq('seller_id', sellerId)
        .eq('status', 'listed');

    if (error) {
        console.error('Error cancelling listing:', error);
        throw new Error('Error al cancelar la publicación');
    }
};

/**
 * Purchase a resale listing
 */
export const purchaseResale = async (
    data: PurchaseResaleData,
    buyerId: string
): Promise<{ success: boolean; newOrderId?: string; error?: string }> => {
    // Get the listing
    const { data: listing, error: listingError } = await supabase
        .from('resales')
        .select('*')
        .eq('id', data.listingId)
        .eq('status', 'listed')
        .single();

    if (listingError || !listing) {
        return { success: false, error: 'Listing no encontrado o ya vendido' };
    }

    if (listing.seller_id === buyerId) {
        return { success: false, error: 'No podés comprar tu propia publicación' };
    }

    // Get original order details
    const { data: originalOrder } = await supabase
        .from('orders')
        .select('ticket_type_id')
        .eq('id', listing.original_order_id)
        .single();

    if (!originalOrder) {
        return { success: false, error: 'Orden original no encontrada' };
    }

    // Generate new QR for buyer
    const newQrCode = await generateQRCode(buyerId, originalOrder.ticket_type_id);
    const verificationCode = generateVerificationCode();

    // Start transaction: Create new order + update listing
    const newOrderId = Crypto.randomUUID();

    // 1. Create new order for buyer
    const { error: orderError } = await supabase
        .from('orders')
        .insert({
            id: newOrderId,
            ticket_type_id: originalOrder.ticket_type_id,
            buyer_id: buyerId,
            base_price: listing.asking_price,
            platform_fee: listing.buyer_service_fee,
            payment_processing_fee: 0,
            tax_amount: 0,
            total_paid: listing.buyer_pays,
            qr_code: newQrCode,
            verification_code: verificationCode,
            payment_status: 'completed',
            is_resale: true,
            original_order_id: listing.original_order_id,
            purchased_at: new Date().toISOString()
        });

    if (orderError) {
        console.error('Error creating resale order:', orderError);
        return { success: false, error: 'Error al procesar la compra' };
    }

    // 2. Mark original order as resold (not usable)
    await supabase
        .from('orders')
        .update({ resale_allowed: false })
        .eq('id', listing.original_order_id);

    // 3. Update listing as sold
    await supabase
        .from('resales')
        .update({
            status: 'sold',
            buyer_id: buyerId,
            sold_at: new Date().toISOString()
        })
        .eq('id', data.listingId);

    return { success: true, newOrderId };
};

/**
 * Get platform config from database
 */
export const getPlatformConfig = async (): Promise<PlatformConfig> => {
    const { data } = await supabase
        .from('platform_config')
        .select('key, value');

    const config: Record<string, number> = {};
    (data || []).forEach((row: any) => {
        config[row.key] = parseFloat(row.value);
    });

    return {
        primaryPlatformFee: config['primary_platform_fee_percentage'] || 10,
        resaleSellerCommission: config['resale_seller_commission_percentage'] || 10,
        resaleBuyerFee: config['resale_buyer_fee_percentage'] || 5,
        paymentProcessingFee: config['payment_processing_fee_percentage'] || 2.9,
        paymentProcessingFixed: config['payment_processing_fee_fixed'] || 0.30,
        payoutMinimum: config['payout_minimum_amount'] || 1000
    };
};

// ============================================================================
// Helper functions
// ============================================================================

const generateQRCode = async (userId: string, ticketTypeId: string): Promise<string> => {
    const data = `TIQLY-RESALE-${userId}-${ticketTypeId}-${Date.now()}`;
    const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        data
    );
    return `TIQLY-${hash.substring(0, 16).toUpperCase()}`;
};

const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const mapResaleListing = (row: any): ResaleListing => ({
    id: row.id,
    originalOrderId: row.original_order_id,
    sellerId: row.seller_id,
    buyerId: row.buyer_id,
    askingPrice: parseFloat(row.asking_price),
    sellerCommission: parseFloat(row.seller_commission),
    buyerServiceFee: parseFloat(row.buyer_service_fee),
    sellerReceives: parseFloat(row.seller_receives),
    buyerPays: parseFloat(row.buyer_pays),
    status: row.status,
    listedAt: new Date(row.listed_at),
    soldAt: row.sold_at ? new Date(row.sold_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
    cancellationReason: row.cancellation_reason
});

const mapResaleListingWithEvent = (row: any): ResaleListing => ({
    ...mapResaleListing(row),
    sellerName: row.seller?.name,
    eventId: row.order?.ticket_type?.event?.id,
    eventTitle: row.order?.ticket_type?.event?.title,
    eventDate: row.order?.ticket_type?.event?.start_date
        ? new Date(row.order.ticket_type.event.start_date)
        : undefined,
    ticketTypeName: row.order?.ticket_type?.name
});

export default {
    calculateResaleFees,
    createResaleListing,
    getEventResales,
    getUserListings,
    cancelResaleListing,
    purchaseResale,
    getPlatformConfig
};
