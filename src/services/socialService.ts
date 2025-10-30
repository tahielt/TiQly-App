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
  deleteDoc,
  Timestamp,
  increment
} from 'firebase/firestore';
import { UserProfile, Follow, EventAttendance, RRPP, RRPPSale, RRPPCode } from '../types/social';

const FOLLOWS_COLLECTION = 'follows';
const ATTENDANCES_COLLECTION = 'attendances';
const RRPP_COLLECTION = 'rrpp';
const RRPP_SALES_COLLECTION = 'rrppSales';
const RRPP_CODES_COLLECTION = 'rrppCodes';
const USERS_COLLECTION = 'users';

// ============================================
// SISTEMA DE SEGUIMIENTO (FOLLOW/UNFOLLOW)
// ============================================

export const followUser = async (followerId: string, followerName: string, followingId: string, followingName: string): Promise<void> => {
  try {
    // Verificar si ya sigue
    const q = query(
      collection(db, FOLLOWS_COLLECTION),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      console.log('Ya sigue a este usuario');
      return;
    }

    await addDoc(collection(db, FOLLOWS_COLLECTION), {
      followerId,
      followerName,
      followingId,
      followingName,
      createdAt: Timestamp.now()
    });

    // Incrementar contadores
    await updateDoc(doc(db, USERS_COLLECTION, followerId), {
      followingCount: increment(1)
    });
    await updateDoc(doc(db, USERS_COLLECTION, followingId), {
      followersCount: increment(1)
    });
  } catch (error) {
    console.error('Error following user:', error);
    throw error;
  }
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, FOLLOWS_COLLECTION),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return;

    await deleteDoc(querySnapshot.docs[0].ref);

    // Decrementar contadores
    await updateDoc(doc(db, USERS_COLLECTION, followerId), {
      followingCount: increment(-1)
    });
    await updateDoc(doc(db, USERS_COLLECTION, followingId), {
      followersCount: increment(-1)
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    throw error;
  }
};

export const getFollowers = async (userId: string): Promise<Follow[]> => {
  try {
    const q = query(
      collection(db, FOLLOWS_COLLECTION),
      where('followingId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Follow[];
  } catch (error) {
    console.error('Error getting followers:', error);
    throw error;
  }
};

export const getFollowing = async (userId: string): Promise<Follow[]> => {
  try {
    const q = query(
      collection(db, FOLLOWS_COLLECTION),
      where('followerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Follow[];
  } catch (error) {
    console.error('Error getting following:', error);
    throw error;
  }
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  try {
    const q = query(
      collection(db, FOLLOWS_COLLECTION),
      where('followerId', '==', followerId),
      where('followingId', '==', followingId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if following:', error);
    return false;
  }
};

// ============================================
// EVENTOS ASISTIDOS (HISTORIAL)
// ============================================

export const recordAttendance = async (
  userId: string,
  userName: string,
  userPhoto: string | undefined,
  eventId: string,
  eventTitle: string,
  eventDate: Date,
  eventCover: string | undefined,
  ticketId: string
): Promise<void> => {
  try {
    await addDoc(collection(db, ATTENDANCES_COLLECTION), {
      userId,
      userName,
      userPhoto,
      eventId,
      eventTitle,
      eventDate: Timestamp.fromDate(eventDate),
      eventCover,
      ticketId,
      attendedAt: Timestamp.now()
    });

    // Incrementar contador de eventos asistidos
    await updateDoc(doc(db, USERS_COLLECTION, userId), {
      eventsAttendedCount: increment(1)
    });
  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};

export const getUserAttendances = async (userId: string): Promise<EventAttendance[]> => {
  try {
    const q = query(
      collection(db, ATTENDANCES_COLLECTION),
      where('userId', '==', userId),
      orderBy('attendedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        eventDate: data.eventDate.toDate(),
        attendedAt: data.attendedAt.toDate()
      } as EventAttendance;
    });
  } catch (error) {
    console.error('Error getting attendances:', error);
    throw error;
  }
};

export const getEventAttendees = async (eventId: string): Promise<EventAttendance[]> => {
  try {
    const q = query(
      collection(db, ATTENDANCES_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('attendedAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        eventDate: data.eventDate.toDate(),
        attendedAt: data.attendedAt.toDate()
      } as EventAttendance;
    });
  } catch (error) {
    console.error('Error getting attendees:', error);
    throw error;
  }
};

// ============================================
// SISTEMA DE RRPP (RELACIONES PÚBLICAS)
// ============================================

export const createRRPP = async (
  userId: string,
  userName: string,
  photoURL: string | undefined,
  organizerId: string,
  eventIds: string[],
  commissionRate: number
): Promise<RRPP> => {
  try {
    const rrppData = {
      userId,
      userName,
      photoURL,
      organizerId,
      eventIds,
      commissionRate,
      totalSales: 0,
      totalEarnings: 0,
      createdAt: Timestamp.now(),
      isActive: true
    };

    const docRef = await addDoc(collection(db, RRPP_COLLECTION), rrppData);

    return {
      id: docRef.id,
      ...rrppData,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error creating RRPP:', error);
    throw error;
  }
};

export const generateRRPPCode = async (rrppId: string, eventId: string): Promise<string> => {
  try {
    // Generar código único
    const code = `RRPP${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    await addDoc(collection(db, RRPP_CODES_COLLECTION), {
      rrppId,
      code,
      eventId,
      uses: 0,
      createdAt: Timestamp.now()
    });

    return code;
  } catch (error) {
    console.error('Error generating RRPP code:', error);
    throw error;
  }
};

export const validateRRPPCode = async (code: string, eventId: string): Promise<string | null> => {
  try {
    const q = query(
      collection(db, RRPP_CODES_COLLECTION),
      where('code', '==', code),
      where('eventId', '==', eventId)
    );
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;

    const doc = querySnapshot.docs[0];
    return doc.data().rrppId;
  } catch (error) {
    console.error('Error validating RRPP code:', error);
    return null;
  }
};

export const recordRRPPSale = async (
  rrppId: string,
  rrppName: string,
  ticketId: string,
  eventId: string,
  eventTitle: string,
  buyerId: string,
  buyerName: string,
  ticketPrice: number,
  commissionRate: number
): Promise<void> => {
  try {
    const commissionAmount = ticketPrice * commissionRate;

    await addDoc(collection(db, RRPP_SALES_COLLECTION), {
      rrppId,
      rrppName,
      ticketId,
      eventId,
      eventTitle,
      buyerId,
      buyerName,
      ticketPrice,
      commissionRate,
      commissionAmount,
      saleDate: Timestamp.now(),
      isPaid: false
    });

    // Actualizar totales del RRPP
    const rrppRef = doc(db, RRPP_COLLECTION, rrppId);
    await updateDoc(rrppRef, {
      totalSales: increment(ticketPrice),
      totalEarnings: increment(commissionAmount)
    });

    // Incrementar uso del código
    const codeQuery = query(
      collection(db, RRPP_CODES_COLLECTION),
      where('rrppId', '==', rrppId),
      where('eventId', '==', eventId)
    );
    const codeSnapshot = await getDocs(codeQuery);
    if (!codeSnapshot.empty) {
      await updateDoc(codeSnapshot.docs[0].ref, {
        uses: increment(1)
      });
    }
  } catch (error) {
    console.error('Error recording RRPP sale:', error);
    throw error;
  }
};

export const getRRPPStats = async (rrppId: string): Promise<RRPP | null> => {
  try {
    const docRef = doc(db, RRPP_COLLECTION, rrppId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return null;

    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt.toDate()
    } as RRPP;
  } catch (error) {
    console.error('Error getting RRPP stats:', error);
    return null;
  }
};

export const getRRPPSales = async (rrppId: string): Promise<RRPPSale[]> => {
  try {
    const q = query(
      collection(db, RRPP_SALES_COLLECTION),
      where('rrppId', '==', rrppId),
      orderBy('saleDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        saleDate: data.saleDate.toDate()
      } as RRPPSale;
    });
  } catch (error) {
    console.error('Error getting RRPP sales:', error);
    throw error;
  }
};

export const getUserRRPP = async (userId: string): Promise<RRPP[]> => {
  try {
    const q = query(
      collection(db, RRPP_COLLECTION),
      where('userId', '==', userId),
      where('isActive', '==', true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as RRPP;
    });
  } catch (error) {
    console.error('Error getting user RRPP:', error);
    throw error;
  }
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  recordAttendance,
  getUserAttendances,
  getEventAttendees,
  createRRPP,
  generateRRPPCode,
  validateRRPPCode,
  recordRRPPSale,
  getRRPPStats,
  getRRPPSales,
  getUserRRPP
};
