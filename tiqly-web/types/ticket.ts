export type TicketStatus = 'active' | 'used' | 'cancelled' | 'transferred';

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
    qrCode: string;
    status: TicketStatus;
    purchaseDate: Date;
    transferHistory: any[];
    originalOwnerId: string;
    createdAt: Date;
    updatedAt: Date;
}
