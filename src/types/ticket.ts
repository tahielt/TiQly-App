// Ticket types for Tiqly App

export type TicketStatus = 'active' | 'used' | 'transferred' | 'cancelled' | 'expired' | 'listed';
export type TransferStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface Ticket {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
  userId: string;
  userName: string;
  userEmail: string;
  ticketTypeId: string;
  ticketTypeName: string;
  price: number;
  basePrice?: number;
  platformFee?: number;
  saleChannel?: 'primary' | 'resale';
  qrCode: string;
  status: TicketStatus;
  purchaseDate: Date;
  usedAt?: Date;
  scannedBy?: string;
  transferHistory: TicketTransfer[];
  originalOwnerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketTransfer {
  id: string;
  ticketId: string;
  eventId?: string;
  eventTitle: string;
  eventDate?: Date;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  toUserEmail: string;
  status: TransferStatus;
  requestDate: Date;
  responseDate?: Date;
  message?: string;
}

export interface TicketValidation {
  ticketId: string;
  eventId: string;
  isValid: boolean;
  reason?: string;
  ticket?: Ticket;
  timestamp: Date;
  scannedBy: string;
}

export interface PurchaseData {
  eventId: string;
  ticketTypeId: string;
  quantity: number;
  totalAmount: number;
  platformFee: number;
  finalAmount: number;
  paymentMethodId?: string;
}
