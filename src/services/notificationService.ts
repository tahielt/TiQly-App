import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export type NotificationType =
  | 'ticket_purchase'
  | 'ticket_transfer_received'
  | 'ticket_transfer_accepted'
  | 'event_reminder'
  | 'event_update'
  | 'event_cancelled'
  | 'marketplace_offer'
  | 'marketplace_sold'
  | 'promo';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PUSH_TOKEN_KEY = '@tiqly_push_token';

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return null;
    }


    // Use any cast to avoid TS errors with expo-constants versions
    const constants = Constants as any;
    const projectId = constants.expoConfig?.extra?.eas?.projectId ?? constants.easConfig?.projectId;
    if (!projectId) {
      // No EAS project configured — skip push token registration silently.
      // Push notifications will work once the project is linked via `eas build`.
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;

    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
    await savePushTokenToDatabase(token);

    if (Platform.OS === 'android') {
      await createNotificationChannels();
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

const savePushTokenToDatabase = async (token: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: user.id,
        push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

const createNotificationChannels = async (): Promise<void> => {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#00D9FF',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('tickets', {
    name: 'Tickets',
    description: 'Notificaciones sobre tus tickets',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#00FF9D',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('events', {
    name: 'Eventos',
    description: 'Recordatorios y actualizaciones de eventos',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#FFD700',
    sound: 'default',
  });

  await Notifications.setNotificationChannelAsync('marketplace', {
    name: 'Marketplace',
    description: 'Ofertas y ventas en el marketplace',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#FF6B35',
    sound: 'default',
  });
};

export const setupNotificationListeners = (
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): (() => void) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(notification => {
    onNotificationReceived?.(notification);
  });

  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
};

export const sendLocalNotification = async (
  title: string,
  body: string,
  data?: Record<string, any>,
): Promise<string> => {
  return await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
    trigger: null,
  });
};

export const scheduleNotification = async (
  title: string,
  body: string,
  triggerDate: Date,
  data?: Record<string, any>,
): Promise<string> => {
  const seconds = Math.max(1, Math.floor((triggerDate.getTime() - Date.now()) / 1000));

  return await Notifications.scheduleNotificationAsync({
    content: { title, body, data, sound: 'default' },
    trigger: { seconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
  });
};

export const notifyTicketPurchase = async (
  eventTitle: string,
  ticketType: string,
  eventDate: Date
): Promise<void> => {
  await sendLocalNotification(
    '🎫 ¡Compra Exitosa!',
    `Tu entrada ${ticketType} para ${eventTitle} está lista. ¡Nos vemos ahí!`,
    { type: 'ticket_purchase', eventTitle, ticketType }
  );

  const reminderDate = new Date(eventDate.getTime() - 24 * 60 * 60 * 1000);
  if (reminderDate > new Date()) {
    await scheduleEventReminder(eventTitle, reminderDate, eventDate);
  }
};

export const notifyTicketTransferReceived = async (
  senderName: string,
  eventTitle: string
): Promise<void> => {
  await sendLocalNotification(
    '🎁 ¡Recibiste un Ticket!',
    `${senderName} te envió una entrada para ${eventTitle}. ¡Aceptala ahora!`,
    { type: 'ticket_transfer_received', senderName, eventTitle }
  );
};

export const notifyTicketTransferAccepted = async (
  recipientName: string,
  eventTitle: string
): Promise<void> => {
  await sendLocalNotification(
    '✅ Transferencia Aceptada',
    `${recipientName} aceptó tu entrada para ${eventTitle}`,
    { type: 'ticket_transfer_accepted', recipientName, eventTitle }
  );
};

export const scheduleEventReminder = async (
  eventTitle: string,
  reminderDate: Date,
  eventDate: Date
): Promise<string | null> => {
  if (reminderDate <= new Date()) return null;

  const timeUntil = formatTimeUntil(eventDate);
  return await scheduleNotification(
    '🔔 ¡Tu evento es pronto!',
    `${eventTitle} es ${timeUntil}. ¿Ya tenés todo listo?`,
    reminderDate,
    { type: 'event_reminder', eventTitle, eventDate: eventDate.toISOString() }
  );
};

export const notifyEventUpdate = async (
  eventTitle: string,
  updateMessage: string
): Promise<void> => {
  await sendLocalNotification(
    '📢 Actualización de Evento',
    `${eventTitle}: ${updateMessage}`,
    { type: 'event_update', eventTitle, updateMessage }
  );
};

export const notifyEventCancelled = async (
  eventTitle: string,
  reason?: string
): Promise<void> => {
  await sendLocalNotification(
    '❌ Evento Cancelado',
    `${eventTitle} fue cancelado${reason ? `: ${reason}` : ''}. Te contactaremos sobre el reembolso.`,
    { type: 'event_cancelled', eventTitle, reason }
  );
};

export const notifyMarketplaceOffer = async (
  buyerName: string,
  eventTitle: string,
  offerPrice: number
): Promise<void> => {
  await sendLocalNotification(
    '💰 ¡Nueva Oferta!',
    `${buyerName} ofreció $${offerPrice.toLocaleString()} por tu entrada para ${eventTitle}`,
    { type: 'marketplace_offer', buyerName, eventTitle, offerPrice }
  );
};

export const notifyMarketplaceSold = async (
  eventTitle: string,
  salePrice: number,
  netProfit: number
): Promise<void> => {
  await sendLocalNotification(
    '🎉 ¡Vendido!',
    `Tu entrada para ${eventTitle} se vendió por $${salePrice.toLocaleString()}. Ganaste $${netProfit.toLocaleString()}`,
    { type: 'marketplace_sold', eventTitle, salePrice, netProfit }
  );
};

const formatTimeUntil = (date: Date): string => {
  const diff = date.getTime() - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 24) return 'hoy';
  if (hours < 48) return 'mañana';
  return `en ${Math.floor(hours / 24)} días`;
};

export const cancelNotification = async (id: string): Promise<void> => {
  await Notifications.cancelScheduledNotificationAsync(id);
};

export const cancelAllNotifications = async (): Promise<void> => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  return await Notifications.getAllScheduledNotificationsAsync();
};

export const getPushToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(PUSH_TOKEN_KEY);
};

export const setBadgeCount = async (count: number): Promise<void> => {
  await Notifications.setBadgeCountAsync(count);
};

export const clearBadge = async (): Promise<void> => {
  await Notifications.setBadgeCountAsync(0);
};

export default {
  registerForPushNotifications,
  setupNotificationListeners,
  sendLocalNotification,
  scheduleNotification,
  notifyTicketPurchase,
  notifyTicketTransferReceived,
  notifyTicketTransferAccepted,
  scheduleEventReminder,
  notifyEventUpdate,
  notifyEventCancelled,
  notifyMarketplaceOffer,
  notifyMarketplaceSold,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,
  getPushToken,
  setBadgeCount,
  clearBadge,
};
