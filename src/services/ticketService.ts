import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ticket, TicketTransfer, TicketValidation, PurchaseData } from '../types/ticket';
import * as Crypto from 'expo-crypto';

const STORAGE_KEYS = {
  TICKETS: 'tiqly_tickets',
  TRANSFERS: 'tiqly_transfers'
};

// Constante de comisión de la plataforma (15%)
export const PLATFORM_FEE_PERCENTAGE = 0.15;

// Generar código QR único para el ticket
const generateQRCode = async (ticketId: string, userId: string, eventId: string): Promise<string> => {
  const data = `${ticketId}:${userId}:${eventId}:${Date.now()}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
};

// Comprar ticket (Mock)
export const purchaseTicket = async (
  purchaseData: PurchaseData,
  userId: string,
  userName: string,
  userEmail: string,
  eventData: { title: string; date: Date; location: string }
): Promise<Ticket> => {
  // Calcular comisión
  const platformFee = purchaseData.totalAmount * PLATFORM_FEE_PERCENTAGE;
  const finalAmount = purchaseData.totalAmount + platformFee;

  const ticketId = Crypto.randomUUID();
  const qrCode = await generateQRCode(ticketId, userId, purchaseData.eventId);

  const newTicket: Ticket = {
    id: ticketId,
    eventId: purchaseData.eventId,
    eventTitle: eventData.title,
    eventDate: eventData.date,
    eventLocation: eventData.location,
    userId,
    userName,
    userEmail,
    ticketTypeId: purchaseData.ticketTypeId,
    ticketTypeName: 'General',
    price: purchaseData.totalAmount,
    qrCode,
    status: 'active',
    purchaseDate: new Date(),
    transferHistory: [],
    originalOwnerId: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Save to storage
  const storedTickets = await getStoredTickets();
  storedTickets.push(newTicket);
  await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(storedTickets));

  return newTicket;
};

// Get stored tickets helper
const getStoredTickets = async (): Promise<Ticket[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!json) return [];
    const parsed = JSON.parse(json);
    // Correct dates
    return parsed.map((t: any) => ({
      ...t,
      eventDate: new Date(t.eventDate),
      purchaseDate: new Date(t.purchaseDate),
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      usedAt: t.usedAt ? new Date(t.usedAt) : undefined
    }));
  } catch (e) {
    return [];
  }
};

// Obtener tickets del usuario
export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  const all = await getStoredTickets();
  return all.filter(t => t.userId === userId).sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
};

export const getUserTicketHistory = async (userId: string): Promise<Ticket[]> => {
  return getUserTickets(userId);
};

// Obtener ticket por ID
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  const all = await getStoredTickets();
  return all.find(t => t.id === ticketId) || null;
};

// Iniciar transferencia de ticket
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

  // Mock: Save pending transfer logic could go here if needed for demo
  return transfer;
};

// Aceptar transferencia de ticket
export const acceptTicketTransfer = async (
  transferId: string,
  ticketId: string,
  newUserId: string,
  newUserName: string,
  newUserEmail: string
): Promise<void> => {
  // Mock acceptance
  const tickets = await getStoredTickets();
  const ticketIndex = tickets.findIndex(t => t.id === ticketId);
  if (ticketIndex >= 0) {
    tickets[ticketIndex].userId = newUserId;
    tickets[ticketIndex].userName = newUserName;
    tickets[ticketIndex].userEmail = newUserEmail;
    tickets[ticketIndex].status = 'transferred';
    // Generate new QR for new owner
    tickets[ticketIndex].qrCode = await generateQRCode(ticketId, newUserId, tickets[ticketIndex].eventId);

    await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }
};

// Rechazar transferencia de ticket
export const rejectTicketTransfer = async (transferId: string): Promise<void> => {
  // Mock reject
};

// Obtener transferencias pendientes del usuario
export const getPendingTransfers = async (userEmail: string): Promise<TicketTransfer[]> => {
  return [];
};

// Validar ticket con QR (para staff/organizador)
export const validateTicket = async (
  qrCode: string,
  scannedBy: string
): Promise<TicketValidation> => {
  const tickets = await getStoredTickets();
  const ticket = tickets.find(t => t.qrCode === qrCode);

  if (!ticket) {
    return { ticketId: '', eventId: '', isValid: false, reason: 'Ticket no encontrado', timestamp: new Date(), scannedBy };
  }

  if (ticket.status !== 'active') {
    return { ticketId: ticket.id, eventId: ticket.eventId, isValid: false, reason: `Ticket ${ticket.status}`, timestamp: new Date(), scannedBy };
  }

  // Mark as used
  const ticketIndex = tickets.findIndex(t => t.id === ticket.id);
  tickets[ticketIndex].status = 'used';
  tickets[ticketIndex].usedAt = new Date();
  await AsyncStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));

  return {
    ticketId: ticket.id,
    eventId: ticket.eventId,
    isValid: true,
    ticket: tickets[ticketIndex],
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
