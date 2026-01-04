// Notification types for Tiqly App

export type NotificationType = 
  | 'ticket_purchase'
  | 'ticket_transfer_received'
  | 'ticket_transfer_accepted'
  | 'event_reminder'
  | 'event_update'
  | 'event_cancelled'
  | 'payment_success'
  | 'payment_failed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  imageUrl?: string;
  actionUrl?: string;
  createdAt: Date;
}

export interface PushNotificationData {
  type: NotificationType;
  eventId?: string;
  ticketId?: string;
  transferId?: string;
  [key: string]: any;
}
