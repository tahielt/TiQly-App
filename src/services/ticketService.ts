import { db } from '../config/firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  query, 
  where,
  orderBy,
  updateDoc,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { Ticket, TicketTransfer, TicketValidation, PurchaseData } from '../types/ticket';
import * as Crypto from 'expo-crypto';
import { recordAttendance } from './socialService';

const TICKETS_COLLECTION = 'tickets';
const TRANSFERS_COLLECTION = 'ticketTransfers';

// Constante de comisión de la plataforma (9%)
const PLATFORM_FEE_PERCENTAGE = 0.09;

// Generar código QR único para el ticket
const generateQRCode = async (ticketId: string, userId: string, eventId: string): Promise<string> => {
  const data = `${ticketId}:${userId}:${eventId}:${Date.now()}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data
  );
  return hash;
};

// Comprar ticket
export const purchaseTicket = async (
  purchaseData: PurchaseData,
  userId: string,
  userName: string,
  userEmail: string,
  eventData: { title: string; date: Date; location: string }
): Promise<Ticket> => {
  try {
    // Calcular comisión de la plataforma (9%)
    const platformFee = purchaseData.totalAmount * PLATFORM_FEE_PERCENTAGE;
    const finalAmount = purchaseData.totalAmount + platformFee; // Monto total que el usuario paga

    // Crear ticket temporal para generar ID
    const ticketRef = await addDoc(collection(db, TICKETS_COLLECTION), {
      eventId: purchaseData.eventId,
      eventTitle: eventData.title,
      eventDate: Timestamp.fromDate(eventData.date),
      eventLocation: eventData.location,
      userId,
      userName,
      userEmail,
      ticketTypeId: purchaseData.ticketTypeId,
      ticketTypeName: 'General', // TODO: obtener del evento
      price: purchaseData.totalAmount,
      status: 'active',
      purchaseDate: Timestamp.now(),
      transferHistory: [],
      originalOwnerId: userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      qrCode: '' // Se actualizará después
    });

    // Generar QR code con el ID del ticket
    const qrCode = await generateQRCode(ticketRef.id, userId, purchaseData.eventId);

    // Actualizar ticket con el QR code
    await updateDoc(ticketRef, { qrCode });

    const ticket: Ticket = {
      id: ticketRef.id,
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

    return ticket;
  } catch (error) {
    console.error('Error purchasing ticket:', error);
    throw error;
  }
};

// Obtener tickets del usuario
export const getUserTickets = async (userId: string): Promise<Ticket[]> => {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('userId', '==', userId),
      orderBy('purchaseDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        eventDate: data.eventDate.toDate(),
        purchaseDate: data.purchaseDate.toDate(),
        usedAt: data.usedAt ? data.usedAt.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Ticket;
    });
  } catch (error) {
    console.error('Error getting user tickets:', error);
    throw error;
  }
};

// Obtener ticket por ID
export const getTicketById = async (ticketId: string): Promise<Ticket | null> => {
  try {
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        eventDate: data.eventDate.toDate(),
        purchaseDate: data.purchaseDate.toDate(),
        usedAt: data.usedAt ? data.usedAt.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Ticket;
    }

    return null;
  } catch (error) {
    console.error('Error getting ticket:', error);
    throw error;
  }
};

// Iniciar transferencia de ticket
export const initiateTicketTransfer = async (
  ticketId: string,
  fromUserId: string,
  fromUserName: string,
  toUserEmail: string,
  message?: string
): Promise<TicketTransfer> => {
  try {
    // TODO: Obtener toUserId y toUserName desde el email
    const toUserId = 'temp-user-id'; // Placeholder
    const toUserName = 'Usuario Destino'; // Placeholder

    const transfer: Omit<TicketTransfer, 'id'> = {
      ticketId,
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      toUserEmail,
      status: 'pending',
      requestDate: new Date(),
      message
    };

    const docRef = await addDoc(collection(db, TRANSFERS_COLLECTION), {
      ...transfer,
      requestDate: Timestamp.now()
    });

    return {
      ...transfer,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error initiating transfer:', error);
    throw error;
  }
};

// Aceptar transferencia de ticket
export const acceptTicketTransfer = async (
  transferId: string,
  ticketId: string,
  newUserId: string,
  newUserName: string,
  newUserEmail: string
): Promise<void> => {
  try {
    // Actualizar estado de transferencia
    const transferRef = doc(db, TRANSFERS_COLLECTION, transferId);
    await updateDoc(transferRef, {
      status: 'accepted',
      responseDate: Timestamp.now()
    });

    // Actualizar ticket con nuevo dueño
    const ticketRef = doc(db, TICKETS_COLLECTION, ticketId);
    const ticketSnap = await getDoc(ticketRef);
    
    if (ticketSnap.exists()) {
      const transferData = {
        id: transferId,
        fromUserId: ticketSnap.data().userId,
        fromUserName: ticketSnap.data().userName,
        toUserId: newUserId,
        toUserName: newUserName,
        toUserEmail: newUserEmail,
        status: 'accepted' as const,
        requestDate: new Date(),
        responseDate: new Date()
      };

      await updateDoc(ticketRef, {
        userId: newUserId,
        userName: newUserName,
        userEmail: newUserEmail,
        status: 'transferred',
        transferHistory: arrayUnion(transferData),
        updatedAt: Timestamp.now()
      });

      // Regenerar QR code
      const newQRCode = await generateQRCode(ticketId, newUserId, ticketSnap.data().eventId);
      await updateDoc(ticketRef, { qrCode: newQRCode, status: 'active' });
    }
  } catch (error) {
    console.error('Error accepting transfer:', error);
    throw error;
  }
};

// Rechazar transferencia de ticket
export const rejectTicketTransfer = async (transferId: string): Promise<void> => {
  try {
    const transferRef = doc(db, TRANSFERS_COLLECTION, transferId);
    await updateDoc(transferRef, {
      status: 'rejected',
      responseDate: Timestamp.now()
    });
  } catch (error) {
    console.error('Error rejecting transfer:', error);
    throw error;
  }
};

// Obtener transferencias pendientes del usuario
export const getPendingTransfers = async (userEmail: string): Promise<TicketTransfer[]> => {
  try {
    const q = query(
      collection(db, TRANSFERS_COLLECTION),
      where('toUserEmail', '==', userEmail),
      where('status', '==', 'pending'),
      orderBy('requestDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        requestDate: data.requestDate.toDate(),
        responseDate: data.responseDate ? data.responseDate.toDate() : undefined
      } as TicketTransfer;
    });
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    throw error;
  }
};

// Validar ticket con QR (para staff/organizador)
export const validateTicket = async (
  qrCode: string,
  scannedBy: string
): Promise<TicketValidation> => {
  try {
    // Buscar ticket por QR code
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('qrCode', '==', qrCode)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        ticketId: '',
        eventId: '',
        isValid: false,
        reason: 'Ticket no encontrado',
        timestamp: new Date(),
        scannedBy
      };
    }

    const ticketDoc = querySnapshot.docs[0];
    const ticketData = ticketDoc.data();

    // Validar estado del ticket
    if (ticketData.status === 'used') {
      return {
        ticketId: ticketDoc.id,
        eventId: ticketData.eventId,
        isValid: false,
        reason: 'Ticket ya utilizado',
        timestamp: new Date(),
        scannedBy
      };
    }

    if (ticketData.status === 'cancelled') {
      return {
        ticketId: ticketDoc.id,
        eventId: ticketData.eventId,
        isValid: false,
        reason: 'Ticket cancelado',
        timestamp: new Date(),
        scannedBy
      };
    }

    if (ticketData.status === 'expired') {
      return {
        ticketId: ticketDoc.id,
        eventId: ticketData.eventId,
        isValid: false,
        reason: 'Ticket expirado',
        timestamp: new Date(),
        scannedBy
      };
    }

    // Marcar ticket como usado
    await updateDoc(ticketDoc.ref, {
      status: 'used',
      usedAt: Timestamp.now(),
      scannedBy,
      updatedAt: Timestamp.now()
    });

    const ticket: Ticket = {
      id: ticketDoc.id,
      ...ticketData,
      eventDate: ticketData.eventDate.toDate(),
      purchaseDate: ticketData.purchaseDate.toDate(),
      usedAt: new Date(),
      createdAt: ticketData.createdAt.toDate(),
      updatedAt: new Date()
    } as Ticket;

    // REGISTRAR ASISTENCIA AL EVENTO (para historial social)
    try {
      await recordAttendance(
        ticketData.userId,
        ticketData.userName,
        undefined, // photoURL (obtener del usuario si está disponible)
        ticketData.eventId,
        ticketData.eventTitle,
        ticketData.eventDate.toDate(),
        undefined, // eventCover
        ticketDoc.id
      );
    } catch (error) {
      console.error('Error recording attendance:', error);
      // No fallar la validación si falla el registro de asistencia
    }

    return {
      ticketId: ticketDoc.id,
      eventId: ticketData.eventId,
      isValid: true,
      ticket,
      timestamp: new Date(),
      scannedBy
    };
  } catch (error) {
    console.error('Error validating ticket:', error);
    throw error;
  }
};

// Obtener historial de tickets del usuario (para perfil)
export const getUserTicketHistory = async (userId: string): Promise<Ticket[]> => {
  try {
    const q = query(
      collection(db, TICKETS_COLLECTION),
      where('userId', '==', userId),
      orderBy('purchaseDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        eventDate: data.eventDate.toDate(),
        purchaseDate: data.purchaseDate.toDate(),
        usedAt: data.usedAt ? data.usedAt.toDate() : undefined,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Ticket;
    });
  } catch (error) {
    console.error('Error getting user ticket history:', error);
    throw error;
  }
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
