import { db, storage } from '../config/firebase';
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
  GeoPoint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Event, EventFilter, EventComment } from '../types/event';

const EVENTS_COLLECTION = 'events';
const COMMENTS_COLLECTION = 'eventComments';

// Crear evento
export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...eventData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      location: {
        ...eventData.location,
        coordinates: new GeoPoint(
          eventData.location.coordinates.latitude,
          eventData.location.coordinates.longitude
        )
      }
    });

    return {
      ...eventData,
      id: docRef.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Obtener eventos con filtros
export const getEvents = async (filter?: EventFilter): Promise<Event[]> => {
  try {
    let q = query(collection(db, EVENTS_COLLECTION), orderBy('startDate', 'desc'));

    // Aplicar filtros
    if (filter?.type && filter.type.length > 0) {
      q = query(q, where('type', 'in', filter.type));
    }

    if (filter?.category && filter.category.length > 0) {
      q = query(q, where('category', 'in', filter.category));
    }

    if (filter?.dateFrom) {
      q = query(q, where('startDate', '>=', Timestamp.fromDate(filter.dateFrom)));
    }

    const querySnapshot = await getDocs(q);
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        location: {
          ...data.location,
          coordinates: {
            latitude: data.location.coordinates.latitude,
            longitude: data.location.coordinates.longitude
          }
        }
      } as Event;
    });

    // Filtros adicionales en cliente (geolocalización)
    if (filter?.location) {
      return events.filter(event => {
        const distance = calculateDistance(
          filter.location!.latitude,
          filter.location!.longitude,
          event.location.coordinates.latitude,
          event.location.coordinates.longitude
        );
        return distance <= filter.location!.radius;
      });
    }

    // Filtro por búsqueda de texto
    if (filter?.search) {
      const searchLower = filter.search.toLowerCase();
      return events.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
};

// Obtener evento por ID
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        location: {
          ...data.location,
          coordinates: {
            latitude: data.location.coordinates.latitude,
            longitude: data.location.coordinates.longitude
          }
        }
      } as Event;
    }

    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    throw error;
  }
};

// Obtener eventos del organizador
export const getOrganizerEvents = async (organizerId: string): Promise<Event[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('organizerId', '==', organizerId),
      orderBy('startDate', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        location: {
          ...data.location,
          coordinates: {
            latitude: data.location.coordinates.latitude,
            longitude: data.location.coordinates.longitude
          }
        }
      } as Event;
    });
  } catch (error) {
    console.error('Error getting organizer events:', error);
    throw error;
  }
};

// Actualizar evento
export const updateEvent = async (eventId: string, updates: Partial<Event>): Promise<void> => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

// Cancelar evento
export const cancelEvent = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(db, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, {
      status: 'cancelled',
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error cancelling event:', error);
    throw error;
  }
};

// Subir imagen de evento
export const uploadEventImage = async (eventId: string, imageUri: string, type: 'cover' | 'gallery'): Promise<string> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const filename = `events/${eventId}/${type}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    
    await uploadBytes(storageRef, blob);
    const downloadUrl = await getDownloadURL(storageRef);
    
    return downloadUrl;
  } catch (error) {
    console.error('Error uploading event image:', error);
    throw error;
  }
};

// Agregar comentario a evento
export const addEventComment = async (comment: Omit<EventComment, 'id' | 'createdAt'>): Promise<EventComment> => {
  try {
    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
      ...comment,
      createdAt: Timestamp.now()
    });

    return {
      ...comment,
      id: docRef.id,
      createdAt: new Date()
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Obtener comentarios de evento
export const getEventComments = async (eventId: string): Promise<EventComment[]> => {
  try {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where('eventId', '==', eventId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as EventComment;
    });
  } catch (error) {
    console.error('Error getting event comments:', error);
    throw error;
  }
};

// Calcular distancia entre dos coordenadas (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default {
  createEvent,
  getEvents,
  getEventById,
  getOrganizerEvents,
  updateEvent,
  cancelEvent,
  uploadEventImage,
  addEventComment,
  getEventComments
};
