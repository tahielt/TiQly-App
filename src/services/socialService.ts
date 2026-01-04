
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock Social Service
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
  // Mock recording attendance
  console.log('Mock: Recording attendance', { userId, eventTitle });
};

export const followUser = async (followerId: string, followerName: string, followingId: string, followingName: string): Promise<void> => {
  console.log('Mock: Following user', { followerName, followingName });
};

export const unfollowUser = async (followerId: string, followingId: string): Promise<void> => {
  console.log('Mock: Unfollowing user', { followerId, followingId });
};

export const getFollowers = async (userId: string): Promise<any[]> => {
  return [];
};

export const getFollowing = async (userId: string): Promise<any[]> => {
  return [];
};

export const isFollowing = async (followerId: string, followingId: string): Promise<boolean> => {
  return false;
};

export const getUserAttendances = async (userId: string): Promise<any[]> => {
  return [];
};

export const getEventAttendees = async (eventId: string): Promise<any[]> => {
  return [];
};

export default {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  isFollowing,
  recordAttendance,
  getUserAttendances,
  getEventAttendees
};
