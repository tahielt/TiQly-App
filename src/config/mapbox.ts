import Mapbox from '@rnmapbox/maps';
import { Platform } from 'react-native';

export const MAPBOX_ACCESS_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

// Initialize Mapbox
Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

if (Platform.OS === 'android') {
  Mapbox.setConnected(true);
}

export const MAPBOX_STYLE = 'mapbox://styles/mapbox/streets-v12';

export interface MapLocation {
  latitude: number;
  longitude: number;
  zoom?: number;
  pitch?: number;
  heading?: number;
}

export const DEFAULT_LOCATION: MapLocation = {
  latitude: -34.6037, // Default to Buenos Aires
  longitude: -58.3816,
  zoom: 12,
  pitch: 0,
  heading: 0,
};

export const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};
