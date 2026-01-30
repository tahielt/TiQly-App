import { supabase } from '../lib/supabase';
import { Ticket, TicketTransfer, TicketValidation, PurchaseData } from '../types/ticket';
import * as Crypto from 'expo-crypto';

// Platform fee percentage (15%)
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
    price_paid: purchaseData.totalAmount, // Schema uses price_paid
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
    price: purchaseData.totalAmount,
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
 * Initiate ticket transfer (placeholder)
 */
export const initiateTicketTransfer = async (
  ticketId: string,
  fromUserId: string,
  fromUserName: string,
  toUserEmail: string,
  message?: string
): Promise<TicketTransfer> => {
  const transferId = Crypto.randomUUID();
  const transfer: TicketTransfer = {
    id: transferId,
    ticketId,
    fromUserId,
    fromUserName,
    toUserId: 'pending_user',
    toUserName: 'TBD',
    toUserEmail,
    status: 'pending',
    requestDate: new Date(),
    message
  };
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
  PLATFORM_FEE_PERCENTAGE
};
