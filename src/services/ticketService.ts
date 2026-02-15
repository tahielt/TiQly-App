import { supabase } from '../lib/supabase';
import { Ticket, TicketTransfer, TicketValidation, PurchaseData } from '../types/ticket';
import * as Crypto from 'expo-crypto';

// Re-export types for convenience
export type { TicketTransfer } from '../types/ticket';

// Platform fee percentage (15% as configured in platform_config)
export const PLATFORM_FEE_PERCENTAGE = 0.15;

// Generate unique QR code for ticket
const generateQRCode = async (ticketId: string, userId: string, eventId: string): Promise<string> => {
  const data = `${ticketId}:${userId}:${eventId}:${Date.now()}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
};


/**
 * Purchase a ticket and save to Supabase
 */
export const purchaseTicket = async (
  purchaseData: PurchaseData,
  userId: string,
  userName: string,
  userEmail: string,
  eventData: { title: string; date: Date; location: string }
): Promise<Ticket> => {
  const ticketId = Crypto.randomUUID();
  const qrCode = await generateQRCode(ticketId, userId, purchaseData.eventId);

  // Ticket data for Supabase insert (matching actual schema)
  const ticketRow = {
    id: ticketId,
    event_id: purchaseData.eventId,
    user_id: userId,
    ticket_type_id: (purchaseData.ticketTypeId && purchaseData.ticketTypeId.length > 30) ? purchaseData.ticketTypeId : null,
    qr_code: qrCode,
    status: 'active',
    price_paid: purchaseData.finalAmount, // Total amount including 15% service fee
    original_owner_id: userId,
    purchase_date: new Date().toISOString(),
  };

  const { data, error } = await supabase.from('tickets').insert(ticketRow).select().single();

  if (error) {
    console.error('Error purchasing ticket:', error);
    throw error;
  }

  // Return Ticket object with event data we already have
  return {
    id: data.id,
    eventId: purchaseData.eventId,
    eventTitle: eventData.title,
    eventDate: eventData.date,
    eventLocation: eventData.location,
    userId: userId,
    userName: userName,
    userEmail: userEmail,
    ticketTypeId: purchaseData.ticketTypeId || '',
    ticketTypeName: 'General',
    price: purchaseData.finalAmount, // Total paid including service fee
    qrCode: data.qr_code,
    status: 'active',
    purchaseDate: new Date(data.purchase_date),
    transferHistory: [],
    originalOwnerId: userId,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.created_at)
  };
};


/**
 * Get all tickets for a user from Supabase (with event data via JOIN)
 */
export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
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
    `)
    .eq('user_id', userId)
    .order('purchase_date', { ascending: false });

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
    ticketTypeName: 'General',
    price: row.price_paid,
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
  const { data, error } = await supabase
    .from('tickets')
    .select(`
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
    `)
    .eq('id', ticketId)
    .single();

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
    ticketTypeName: 'General',
    price: data.price_paid,
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
  const transfer: TicketTransfer = {
    id: transferId,
    ticketId,
    eventId: ticketData?.event_id,
    eventTitle: eventInfo?.title || 'Evento',
    eventDate: eventInfo?.start_date ? new Date(eventInfo.start_date) : undefined,
    fromUserId,
    fromUserName,
    toUserId: 'pending_user',
    toUserName: 'TBD',
    toUserEmail,
    status: 'pending',
    requestDate: new Date(),
    message
  };

  // TODO: Save transfer to database (ticket_transfers table)

  return transfer;
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
};


/**
 * Reject ticket transfer (placeholder)
 */
export const rejectTicketTransfer = async (transferId: string): Promise<void> => { };


/**
 * Get pending transfers for a user (placeholder)
 */
export const getPendingTransfers = async (userEmail: string): Promise<TicketTransfer[]> => {
  return [];
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
export const RESALE_FEE_PERCENTAGE = 0.10;
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
