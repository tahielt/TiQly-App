/**
 * TiQly Resale Marketplace Service
 * All pricing is sourced from platform_config and finalized server-side.
 */

import { supabase } from '../lib/supabase';
import {
  ResaleListing,
  CreateResaleData,
  PurchaseResaleData,
  PlatformConfig,
} from '../types/resale';
import {
  calculateResalePricing,
  DEFAULT_PRIMARY_FEE_PCT,
  DEFAULT_PUBLISH_FEE,
  DEFAULT_RESALE_FEE_PCT,
  getPlatformConfig as getMonetizationConfig,
} from './monetizationService';

export const calculateResaleFees = (askingPrice: number, resaleFeePct = DEFAULT_RESALE_FEE_PCT) => {
  return calculateResalePricing(askingPrice, resaleFeePct);
};

export const createResaleListing = async (
  data: CreateResaleData,
  _sellerId: string,
): Promise<ResaleListing> => {
  const { data: response, error } = await supabase.functions.invoke('create-resale-listing', {
    body: {
      ticketId: data.ticketId,
      askingPrice: data.askingPrice,
      expiresInDays: data.expiresInDays ?? 30,
    },
  });

  if (error) {
    console.error('Error creating resale listing:', error);
    throw new Error(error.message || 'No se pudo crear la publicación');
  }

  if (!response?.listing?.id) {
    throw new Error('Respuesta inválida del servidor');
  }

  return mapListingPayload(response.listing);
};

export const getEventResales = async (eventId: string): Promise<ResaleListing[]> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .select(`
      *,
      event:events!event_id (
        id,
        title,
        start_date
      ),
      seller:profiles!seller_id (
        name
      ),
      ticket:tickets!ticket_id (
        ticket_type_id,
        ticket_type:ticket_types!ticket_type_id (
          name
        )
      )
    `)
    .eq('event_id', eventId)
    .eq('status', 'listed')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching resales:', error);
    return [];
  }

  return (data || []).map(mapListingRow);
};

export const getMarketListings = async (): Promise<ResaleListing[]> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .select(`
      *,
      event:events!event_id (
        id,
        title,
        start_date
      ),
      seller:profiles!seller_id (
        name
      ),
      ticket:tickets!ticket_id (
        ticket_type_id,
        ticket_type:ticket_types!ticket_type_id (
          name
        )
      )
    `)
    .eq('status', 'listed')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching market listings:', error);
    return [];
  }

  return (data || []).map(mapListingRow);
};

export const getUserListings = async (userId: string): Promise<ResaleListing[]> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .select(`
      *,
      event:events!event_id (
        id,
        title,
        start_date
      ),
      seller:profiles!seller_id (
        name
      ),
      ticket:tickets!ticket_id (
        ticket_type_id,
        ticket_type:ticket_types!ticket_type_id (
          name
        )
      )
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user listings:', error);
    return [];
  }

  return (data || []).map(mapListingRow);
};

export const cancelResaleListing = async (
  listingId: string,
  _sellerId: string,
): Promise<void> => {
  const { data, error } = await supabase.rpc('cancel_resale_listing_atomic', {
    p_listing_id: listingId,
    p_seller_id: _sellerId,
  });

  if (error || !data?.success) {
    console.error('Error cancelling listing:', error);
    throw new Error(error?.message || 'No se pudo cancelar la publicación');
  }
};

export const purchaseResale = async (
  data: PurchaseResaleData,
  buyerId: string,
): Promise<{ success: boolean; error?: string }> => {
  const { data: response, error } = await supabase.functions.invoke('purchase-resale', {
    body: {
      listingId: data.listingId,
    },
  });

  if (error) {
    console.error('Error purchasing resale:', error);
    return { success: false, error: error.message || 'No se pudo completar la compra' };
  }

  if (!response?.ticket?.id) {
    return { success: false, error: 'Respuesta inválida del servidor' };
  }

  return { success: true };
};

export const getPlatformConfig = async (): Promise<PlatformConfig> => {
  const config = await getMonetizationConfig();

  return {
    primaryFeePct: config.primaryFeePct ?? DEFAULT_PRIMARY_FEE_PCT,
    resaleFeePct: config.resaleFeePct ?? DEFAULT_RESALE_FEE_PCT,
    publishFee: config.publishFee ?? DEFAULT_PUBLISH_FEE,
  };
};

const mapListingPayload = (payload: any): ResaleListing => ({
  id: payload.id,
  ticketId: payload.ticketId,
  sellerId: payload.sellerId,
  buyerId: payload.buyerId,
  askingPrice: Number(payload.askingPrice || 0),
  originalPrice: Number(payload.originalPrice || 0),
  platformFee: Number(payload.platformFee || 0),
  sellerReceives: Number(payload.sellerReceives || 0),
  buyerPays: Number(payload.buyerPays || 0),
  status: payload.status || 'listed',
  listedAt: new Date(payload.createdAt || new Date().toISOString()),
  soldAt: payload.soldAt ? new Date(payload.soldAt) : undefined,
  expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : undefined,
  eventId: payload.eventId,
  eventTitle: payload.eventTitle,
  eventDate: payload.eventDate ? new Date(payload.eventDate) : undefined,
  ticketTypeName: payload.ticketTypeName,
});

const mapListingRow = (row: any): ResaleListing => ({
  id: row.id,
  ticketId: row.ticket_id,
  sellerId: row.seller_id,
  sellerName: row.seller?.name,
  buyerId: row.buyer_id,
  askingPrice: Number(row.asking_price || 0),
  originalPrice: Number(row.original_price || 0),
  platformFee: Number(row.platform_fee || 0),
  sellerReceives: Number(row.seller_receives || 0),
  buyerPays: Number(row.buyer_pays || 0),
  status: row.status || 'listed',
  listedAt: new Date(row.created_at || new Date().toISOString()),
  soldAt: row.sold_at ? new Date(row.sold_at) : undefined,
  expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
  eventId: row.event?.id || row.event_id,
  eventTitle: row.event?.title,
  eventDate: row.event?.start_date ? new Date(row.event.start_date) : undefined,
  ticketTypeName: row.ticket?.ticket_type?.name || 'General',
});

export default {
  calculateResaleFees,
  createResaleListing,
  getEventResales,
  getUserListings,
  cancelResaleListing,
  purchaseResale,
  getPlatformConfig,
};



