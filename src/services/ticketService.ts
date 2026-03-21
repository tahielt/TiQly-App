import { supabase } from '../lib/supabase';
import { Ticket, TicketTransfer, TicketValidation, PurchaseData } from '../types/ticket';
import * as Crypto from 'expo-crypto';
import { DEFAULT_PRIMARY_FEE_PCT, DEFAULT_RESALE_FEE_PCT } from './monetizationService';

// Re-export types for convenience
export type { TicketTransfer } from '../types/ticket';

// Default platform fee percentage fallback. Real pricing comes from platform_config.
export const PLATFORM_FEE_PERCENTAGE = DEFAULT_PRIMARY_FEE_PCT;

// Generate unique QR code for ticket
const generateQRCode = async (ticketId: string, userId: string, eventId: string): Promise<string> => {
  const data = `${ticketId}:${userId}:${eventId}:${Date.now()}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
};

const isMissingRelation = (error: any, name: string) => {
  const message = (error?.message || '').toLowerCase();
  return message.includes(name) && (message.includes('does not exist') || message.includes('relation'));
};


/**
 * Purchase a ticket and save to Supabase
 */
export const purchaseTicket = async (
  purchaseData: PurchaseData,
  userId: string,
  userName: string,
  userEmail: string,
  eventData: { title: string; date: Date; location: string; ticketTypeName?: string }
): Promise<Ticket> => {
  const { data, error } = await supabase.functions.invoke('purchase-ticket', {
    body: {
      eventId: purchaseData.eventId,
      ticketTypeId: purchaseData.ticketTypeId || null,
      quantity: purchaseData.quantity || 1,
    },
  });

  if (error) {
    console.error('Error purchasing ticket:', error);
    throw new Error(error.message || 'No se pudo procesar la compra');
  }

  const ticketResponse = data?.tickets?.[0] || data?.ticket;
  if (!ticketResponse?.id) {
    throw new Error('Respuesta inválida del servidor');
  }

  const pricePaid = Number(ticketResponse.pricePaid ?? data?.pricing?.unitFinalAmount ?? data?.pricing?.finalAmount ?? purchaseData.finalAmount ?? 0);
  const basePrice = Number(ticketResponse.basePrice ?? data?.pricing?.unitBasePrice ?? purchaseData.totalAmount ?? 0);
  const platformFee = Number(ticketResponse.platformFee ?? data?.pricing?.unitFeeAmount ?? purchaseData.platformFee ?? 0);
  const purchaseDate = ticketResponse.purchaseDate ? new Date(ticketResponse.purchaseDate) : new Date();

  return {
    id: ticketResponse.id,
    eventId: purchaseData.eventId,
    eventTitle: eventData.title,
    eventDate: eventData.date,
    eventLocation: eventData.location,
    userId: userId,
    userName: userName,
    userEmail: userEmail,
    ticketTypeId: ticketResponse.ticketTypeId || data?.ticketType?.id || purchaseData.ticketTypeId || '',
    ticketTypeName: ticketResponse.ticketTypeName || data?.ticketType?.name || eventData.ticketTypeName || 'General',
    price: pricePaid,
    basePrice,
    platformFee,
    saleChannel: ticketResponse.saleChannel || 'primary',
    qrCode: ticketResponse.qrCode || '',
    status: 'active',
    purchaseDate,
    transferHistory: [],
    originalOwnerId: userId,
    createdAt: ticketResponse.createdAt ? new Date(ticketResponse.createdAt) : purchaseDate,
    updatedAt: ticketResponse.createdAt ? new Date(ticketResponse.createdAt) : purchaseDate,
  };
};
/**
 * Get all tickets for a user from Supabase (with event data via JOIN)
 */
export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  const selectWithType = `
      *,
      event:events!event_id (
        title,
        start_date,
        address,
        city
      ),
      owner:profiles!user_id (
        name,
        email
      ),
      ticket_type:ticket_types!ticket_type_id (
        name
      )
    `;

  const selectBasic = `
      *,
      event:events!event_id (
        title,
        start_date,
        address,
        city
      ),
      owner:profiles!user_id (
        name,
        email
      )
    `;

  let { data, error } = await supabase
    .from('tickets')
    .select(selectWithType)
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false });

  if (error && isMissingRelation(error, 'ticket_types')) {
    const fallback = await supabase
      .from('tickets')
      .select(selectBasic)
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    data = fallback.data as any;
    error = fallback.error;
  }

  if (error) {
    console.error('Error fetching user tickets:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    eventId: row.event_id,
    eventTitle: row.event?.title || 'Evento',
    eventDate: new Date(row.event?.start_date || row.purchase_date),
    eventLocation: `${row.event?.address || ''}, ${row.event?.city || ''}`,
    userId: row.user_id,
    userName: row.owner?.name || 'Usuario',
    userEmail: row.owner?.email || '',
    ticketTypeId: row.ticket_type_id || '',
    ticketTypeName: row.ticket_type?.name || 'General',
    price: row.price_paid,
    basePrice: row.base_price,
    platformFee: row.platform_fee,
    saleChannel: row.sale_channel,
    qrCode: row.qr_code,
    status: row.status,
    purchaseDate: new Date(row.purchase_date),
    usedAt: row.used_at ? new Date(row.used_at) : undefined,
    transferHistory: [],
    originalOwnerId: row.original_owner_id,
    createdAt: new Date(row.created_at || row.purchase_date),
    updatedAt: new Date(row.created_at || row.purchase_date)
  }));
};

export const getUserTicketHistory = async (userId: string): Promise<Ticket[]> => {
  return getUserTickets(userId);
};


/**
 * Get a single ticket by ID
 */
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  const selectWithType = `
      *,
      event:events!event_id (
        title,
        start_date,
        address,
        city
      ),
      owner:profiles!user_id (
        name,
        email
      ),
      ticket_type:ticket_types!ticket_type_id (
        name
      )
    `;

  const selectBasic = `
      *,
      event:events!event_id (
        title,
        start_date,
        address,
        city
      ),
      owner:profiles!user_id (
        name,
        email
      )
    `;

  let { data, error } = await supabase
    .from('tickets')
    .select(selectWithType)
    .eq('id', ticketId)
    .single();

  if (error && isMissingRelation(error, 'ticket_types')) {
    const fallback = await supabase
      .from('tickets')
      .select(selectBasic)
      .eq('id', ticketId)
      .single();

    data = fallback.data as any;
    error = fallback.error;
  }

  if (error) {
    console.error('Error fetching ticket:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    eventId: data.event_id,
    eventTitle: data.event?.title || 'Evento',
    eventDate: new Date(data.event?.start_date || data.purchase_date),
    eventLocation: `${data.event?.address || ''}, ${data.event?.city || ''}`,
    userId: data.user_id,
    userName: data.owner?.name || 'Usuario',
    userEmail: data.owner?.email || '',
    ticketTypeId: data.ticket_type_id || '',
    ticketTypeName: data.ticket_type?.name || 'General',
    price: data.price_paid,
    basePrice: data.base_price,
    platformFee: data.platform_fee,
    saleChannel: data.sale_channel,
    qrCode: data.qr_code,
    status: data.status,
    purchaseDate: new Date(data.purchase_date),
    usedAt: data.used_at ? new Date(data.used_at) : undefined,
    transferHistory: [],
    originalOwnerId: data.original_owner_id,
    createdAt: new Date(data.created_at || data.purchase_date),
    updatedAt: new Date(data.created_at || data.purchase_date)
  };
};


export const getEventTicketSales = async (eventId: string) => {
  const selectWithType = `
      id,
      price_paid,
      base_price,
      platform_fee,
      sale_channel,
      purchase_date,
      user_id,
      ticket_type_id,
      user:profiles!user_id (
        name,
        email
      ),
      ticket_type:ticket_types!ticket_type_id (
        name
      )
    `;

  const selectBasic = `
      id,
      price_paid,
      base_price,
      platform_fee,
      sale_channel,
      purchase_date,
      user_id,
      ticket_type_id,
      user:profiles!user_id (
        name,
        email
      )
    `;

  let { data, error } = await supabase
    .from('tickets')
    .select(selectWithType)
    .eq('event_id', eventId)
    .order('purchase_date', { ascending: false });

  if (error && isMissingRelation(error, 'ticket_types')) {
    const fallback = await supabase
      .from('tickets')
      .select(selectBasic)
      .eq('event_id', eventId)
      .order('purchase_date', { ascending: false });

    data = fallback.data as any;
    error = fallback.error;
  }

  if (error) {
    console.error('Error fetching event ticket sales:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    buyerName: row.user?.name || 'Usuario',
    email: row.user?.email || '',
    ticketType: row.ticket_type?.name || 'General',
    price: row.price_paid || 0,
    basePrice: row.base_price || 0,
    platformFee: row.platform_fee || 0,
    saleChannel: row.sale_channel || 'primary',
    date: row.purchase_date || row.created_at,
  }));
};


/**
 * Initiate ticket transfer
 */
export const initiateTicketTransfer = async (
  ticketId: string,
  fromUserId: string,
  fromUserName: string,
  toUserEmail: string,
  message?: string
): Promise<TicketTransfer> => {
  // Get ticket info for eventTitle
  const { data: ticketData } = await supabase
    .from('tickets')
    .select('event_id, event:events!event_id(title, start_date)')
    .eq('id', ticketId)
    .single();

  const eventInfo = (ticketData as any)?.event;
  const transferId = Crypto.randomUUID();

  const transferPayload = {
    id: transferId,
    ticket_id: ticketId,
    event_id: ticketData?.event_id,
    event_title: eventInfo?.title || 'Evento',
    event_date: eventInfo?.start_date || null,
    from_user_id: fromUserId,
    from_user_name: fromUserName,
    to_user_email: toUserEmail,
    status: 'pending',
    message: message || null,
    request_date: new Date().toISOString(),
  };

  const { data: transferRow, error: transferError } = await supabase
    .from('ticket_transfers')
    .insert(transferPayload)
    .select()
    .single();

  if (transferError) {
    console.error('Error creating transfer:', transferError);
    if (isMissingRelation(transferError, 'ticket_transfers')) {
      throw new Error('Transferencias no disponibles por ahora.');
    }
    throw transferError;
  }

  return {
    id: transferRow?.id || transferId,
    ticketId,
    eventId: transferRow?.event_id || ticketData?.event_id,
    eventTitle: transferRow?.event_title || eventInfo?.title || 'Evento',
    eventDate: transferRow?.event_date ? new Date(transferRow.event_date) : undefined,
    fromUserId,
    fromUserName,
    toUserId: transferRow?.to_user_id || 'pending_user',
    toUserName: transferRow?.to_user_name || 'TBD',
    toUserEmail,
    status: transferRow?.status || 'pending',
    requestDate: transferRow?.request_date ? new Date(transferRow.request_date) : new Date(),
    responseDate: transferRow?.response_date ? new Date(transferRow.response_date) : undefined,
    message
  };
};


/**
 * Accept ticket transfer
 */
export const acceptTicketTransfer = async (
  transferId: string,
  ticketId: string,
  newUserId: string,
  newUserName: string,
  newUserEmail: string
): Promise<void> => {
  const newQrCode = await generateQRCode(ticketId, newUserId, '');

  const { error } = await supabase
    .from('tickets')
    .update({
      user_id: newUserId,
      qr_code: newQrCode,
      status: 'transferred',
      transferred_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  if (error) {
    console.error('Error accepting transfer:', error);
    throw error;
  }

  const { error: transferError } = await supabase
    .from('ticket_transfers')
    .update({
      status: 'accepted',
      to_user_id: newUserId,
      to_user_name: newUserName,
      to_user_email: newUserEmail,
      response_date: new Date().toISOString(),
    })
    .eq('id', transferId);

  if (transferError && !isMissingRelation(transferError, 'ticket_transfers')) {
    console.error('Error updating transfer:', transferError);
  }
};


/**
 * Reject ticket transfer
 */
export const rejectTicketTransfer = async (transferId: string): Promise<void> => {
  const { error } = await supabase
    .from('ticket_transfers')
    .update({
      status: 'rejected',
      response_date: new Date().toISOString(),
    })
    .eq('id', transferId);

  if (error && !isMissingRelation(error, 'ticket_transfers')) {
    console.error('Error rejecting transfer:', error);
    throw error;
  }
};


/**
 * Get pending transfers for a user
 */
export const getPendingTransfers = async (userEmail: string): Promise<TicketTransfer[]> => {
  const { data, error } = await supabase
    .from('ticket_transfers')
    .select('*')
    .eq('to_user_email', userEmail)
    .eq('status', 'pending')
    .order('request_date', { ascending: false });

  if (error) {
    if (isMissingRelation(error, 'ticket_transfers')) {
      return [];
    }
    console.error('Error fetching transfers:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    ticketId: row.ticket_id,
    eventId: row.event_id,
    eventTitle: row.event_title || 'Evento',
    eventDate: row.event_date ? new Date(row.event_date) : undefined,
    fromUserId: row.from_user_id,
    fromUserName: row.from_user_name || 'Usuario',
    toUserId: row.to_user_id || 'pending_user',
    toUserName: row.to_user_name || 'TBD',
    toUserEmail: row.to_user_email,
    status: row.status || 'pending',
    requestDate: row.request_date ? new Date(row.request_date) : new Date(),
    responseDate: row.response_date ? new Date(row.response_date) : undefined,
    message: row.message || undefined,
  }));
};


/**
 * Validate ticket with QR code (for staff/organizer) - Updates status to 'used'
 */
export const validateTicket = async (
  qrCode: string,
  scannedBy: string
): Promise<TicketValidation> => {
  // Find ticket by QR code
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('qr_code', qrCode)
    .single();

  if (error || !ticket) {
    return {
      ticketId: '',
      eventId: '',
      isValid: false,
      reason: 'Ticket no encontrado',
      timestamp: new Date(),
      scannedBy
    };
  }

  if (ticket.status !== 'active') {
    return {
      ticketId: ticket.id,
      eventId: ticket.event_id,
      isValid: false,
      reason: `Ticket ${ticket.status}`,
      timestamp: new Date(),
      scannedBy
    };
  }

  // Mark ticket as used
  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'used',
      used_at: new Date().toISOString(),
      used_by: scannedBy
    })
    .eq('id', ticket.id);

  if (updateError) {
    console.error('Error marking ticket as used:', updateError);
  }

  return {
    ticketId: ticket.id,
    eventId: ticket.event_id,
    isValid: true,
    timestamp: new Date(),
    scannedBy
  };
};


// ==========================================
// MARKETPLACE / SWAP FUNCTIONS
// ==========================================

export interface TicketListing {
  id: string;
  ticketId: string;
  sellerId: string;
  sellerName: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventImage: string;
  ticketTier: string;
  originalPrice: number;
  askingPrice: number;
  status: 'active' | 'sold' | 'cancelled' | 'expired';
  createdAt: Date;
}

// Platform fee for resales (10%)
export const RESALE_FEE_PERCENTAGE = DEFAULT_RESALE_FEE_PCT;
// Max markup allowed (150% of original)
export const MAX_MARKUP_PERCENTAGE = 1.5;


/**
 * List a ticket for sale in the marketplace
 */
export const listTicketForSale = async (
  ticketId: string,
  askingPrice: number,
  sellerId: string
): Promise<TicketListing> => {
  // 1. Get ticket and verify ownership
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*, event:events!event_id(title, start_date, cover_image)')
    .eq('id', ticketId)
    .eq('user_id', sellerId)
    .eq('status', 'active')
    .single();

  if (ticketError || !ticket) {
    throw new Error('Ticket no encontrado o no te pertenece');
  }

  // 1.5 Check if ticket is already listed
  const { data: existingListing } = await supabase
    .from('ticket_listings')
    .select('id, status')
    .eq('ticket_id', ticketId)
    .in('status', ['active'])
    .maybeSingle();

  if (existingListing) {
    throw new Error('Este ticket ya está publicado en el marketplace');
  }

  // 2. Check max price (anti-speculation)
  const maxAllowedPrice = ticket.price_paid * MAX_MARKUP_PERCENTAGE;
  if (askingPrice > maxAllowedPrice) {
    throw new Error(`Precio máximo permitido: $${maxAllowedPrice.toLocaleString()}`);
  }

  // 3. Calculate expiration (2hrs before event)
  const eventDate = new Date(ticket.event?.start_date);
  const expiresAt = new Date(eventDate.getTime() - 2 * 60 * 60 * 1000);

  // 4. Create listing
  const { data: listing, error: listingError } = await supabase
    .from('ticket_listings')
    .insert({
      ticket_id: ticketId,
      seller_id: sellerId,
      event_id: ticket.event_id,
      original_price: ticket.price_paid,
      asking_price: askingPrice,
      status: 'active',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (listingError) {
    console.error('Error creating listing:', listingError);
    throw new Error('Error al publicar el ticket');
  }

  // 5. Mark ticket as listed
  await supabase
    .from('tickets')
    .update({ status: 'listed' })
    .eq('id', ticketId);

  return {
    id: listing.id,
    ticketId: listing.ticket_id,
    sellerId: listing.seller_id,
    sellerName: 'Vos',
    eventId: listing.event_id,
    eventTitle: ticket.event?.title || 'Evento',
    eventDate: new Date(ticket.event?.start_date),
    eventImage: ticket.event?.cover_image || '',
    ticketTier: 'General',
    originalPrice: listing.original_price,
    askingPrice: listing.asking_price,
    status: listing.status,
    createdAt: new Date(listing.created_at),
  };
};


/**
 * Get all active listings for the marketplace
 */
export const getActiveListings = async (eventId?: string): Promise<TicketListing[]> => {
  let query = supabase
    .from('ticket_listings')
    .select(`
      *,
      ticket:tickets!ticket_id(price_paid, ticket_type_id),
      event:events!event_id(title, start_date, cover_image),
      seller:profiles!seller_id(name)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (eventId) {
    query = query.eq('event_id', eventId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    ticketId: row.ticket_id,
    sellerId: row.seller_id,
    sellerName: row.seller?.name || 'Vendedor',
    eventId: row.event_id,
    eventTitle: row.event?.title || 'Evento',
    eventDate: new Date(row.event?.start_date),
    eventImage: row.event?.cover_image || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
    ticketTier: 'General',
    originalPrice: row.original_price,
    askingPrice: row.asking_price,
    status: row.status,
    createdAt: new Date(row.created_at),
  }));
};


/**
 * Purchase a listed ticket
 */
export const purchaseListedTicket = async (
  listingId: string,
  buyerId: string,
  buyerName: string,
  buyerEmail: string
): Promise<Ticket> => {
  // 1. Get listing and verify it's active
  const { data: listing, error: listingError } = await supabase
    .from('ticket_listings')
    .select('*, ticket:tickets!ticket_id(*), event:events!event_id(title, start_date, address)')
    .eq('id', listingId)
    .eq('status', 'active')
    .single();

  if (listingError || !listing) {
    throw new Error('Listing no disponible');
  }

  // 2. Generate new QR for buyer
  const newQrCode = await generateQRCode(listing.ticket_id, buyerId, listing.event_id);

  // 3. Transfer ticket to buyer
  const { error: transferError } = await supabase
    .from('tickets')
    .update({
      user_id: buyerId,
      qr_code: newQrCode,
      status: 'active', // Back to active after purchase
      transferred_at: new Date().toISOString(),
    })
    .eq('id', listing.ticket_id);

  if (transferError) {
    throw new Error('Error al transferir el ticket');
  }

  // 4. Mark listing as sold
  await supabase
    .from('ticket_listings')
    .update({
      status: 'sold',
      buyer_id: buyerId,
      sold_at: new Date().toISOString(),
    })
    .eq('id', listingId);

  // 5. Return the purchased ticket
  return {
    id: listing.ticket_id,
    eventId: listing.event_id,
    eventTitle: listing.event?.title || 'Evento',
    eventDate: new Date(listing.event?.start_date),
    eventLocation: listing.event?.address || '',
    userId: buyerId,
    userName: buyerName,
    userEmail: buyerEmail,
    ticketTypeId: listing.ticket?.ticket_type_id || '',
    ticketTypeName: 'General',
    price: listing.asking_price,
    qrCode: newQrCode,
    status: 'active',
    purchaseDate: new Date(),
    transferHistory: [],
    originalOwnerId: listing.seller_id,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};


/**
 * Cancel a listing (seller only)
 */
export const cancelListing = async (listingId: string, sellerId: string): Promise<void> => {
  // 1. Verify ownership
  const { data: listing, error } = await supabase
    .from('ticket_listings')
    .select('ticket_id')
    .eq('id', listingId)
    .eq('seller_id', sellerId)
    .eq('status', 'active')
    .single();

  if (error || !listing) {
    throw new Error('Listing no encontrado o no te pertenece');
  }

  // 2. Cancel listing
  await supabase
    .from('ticket_listings')
    .update({ status: 'cancelled' })
    .eq('id', listingId);

  // 3. Restore ticket status
  await supabase
    .from('tickets')
    .update({ status: 'active' })
    .eq('id', listing.ticket_id);
};


/**
 * Get user's own listings
 */
export const getUserListings = async (userId: string): Promise<TicketListing[]> => {
  const { data, error } = await supabase
    .from('ticket_listings')
    .select(`
      *,
      event:events!event_id(title, start_date, cover_image)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user listings:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    ticketId: row.ticket_id,
    sellerId: row.seller_id,
    sellerName: 'Vos',
    eventId: row.event_id,
    eventTitle: row.event?.title || 'Evento',
    eventDate: new Date(row.event?.start_date),
    eventImage: row.event?.cover_image || '',
    ticketTier: 'General',
    originalPrice: row.original_price,
    askingPrice: row.asking_price,
    status: row.status,
    createdAt: new Date(row.created_at),
  }));
};


export default {
  purchaseTicket,
  getUserTickets,
  getTicketById,
  getEventTicketSales,
  initiateTicketTransfer,
  acceptTicketTransfer,
  rejectTicketTransfer,
  getPendingTransfers,
  validateTicket,
  getUserTicketHistory,
  // Marketplace
  listTicketForSale,
  getActiveListings,
  purchaseListedTicket,
  cancelListing,
  getUserListings,
  PLATFORM_FEE_PERCENTAGE,
  RESALE_FEE_PERCENTAGE,
  MAX_MARKUP_PERCENTAGE,
};







