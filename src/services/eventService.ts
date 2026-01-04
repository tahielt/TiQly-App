
import { MOCK_EVENTS } from '../lib/mock-data';

// Mock Event Service
export const getEvents = async (filter?: any): Promise<any[]> => {
  return MOCK_EVENTS;
};

export const getEventById = async (eventId: string): Promise<any | null> => {
  return MOCK_EVENTS.find(e => e.id === eventId) || null;
};

export const createEvent = async (eventData: any): Promise<any> => {
  return { ...eventData, id: `evt_${Date.now()}`, createdAt: new Date() };
};

export const updateEvent = async (eventId: string, updates: any): Promise<void> => {
  console.log('Mock: Updating event', eventId);
};

export const cancelEvent = async (eventId: string): Promise<void> => {
  console.log('Mock: Cancelling event', eventId);
};

export const uploadEventImage = async (eventId: string, imageUri: string, type: string): Promise<string> => {
  return imageUri;
};

export default {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  uploadEventImage
};
