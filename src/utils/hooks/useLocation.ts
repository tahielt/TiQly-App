/**
 * useLocation Hook - Using expo-location
 * Provides geolocation functionality with Expo APIs
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as ExpoLocation from 'expo-location';

type Location = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  altitudeAccuracy: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

type LocationError = {
  code: number;
  message: string;
};

type UseLocationOptions = {
  enableHighAccuracy?: boolean;
  timeout?: number;
  distanceFilter?: number;
};

const defaultOptions: UseLocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  distanceFilter: 10,
};

/**
 * Custom hook for geolocation using expo-location
 */
function useLocation(options: UseLocationOptions = {}) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const watchSubscription = useRef<ExpoLocation.LocationSubscription | null>(null);

  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  const hasLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError({
          code: 1,
          message: 'Location permission denied by user',
        });
        return false;
      }
      return true;
    } catch (err) {
      setError({
        code: 2,
        message: 'Failed to request location permission',
      });
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<Location | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await hasLocationPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: mergedOptions.enableHighAccuracy
          ? ExpoLocation.Accuracy.High
          : ExpoLocation.Accuracy.Balanced,
      });

      const formattedLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        altitude: position.coords.altitude ?? null,
        altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
        timestamp: position.timestamp,
      };

      setLocation(formattedLocation);
      setIsLoading(false);
      return formattedLocation;
    } catch (err: any) {
      const locationError: LocationError = {
        code: err.code || 0,
        message: err.message || 'Failed to get location',
      };
      setError(locationError);
      setIsLoading(false);
      return null;
    }
  }, [hasLocationPermission, mergedOptions.enableHighAccuracy]);

  const startWatching = useCallback(async (): Promise<void> => {
    if (watchSubscription.current) {
      return;
    }

    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      return;
    }

    watchSubscription.current = await ExpoLocation.watchPositionAsync(
      {
        accuracy: mergedOptions.enableHighAccuracy
          ? ExpoLocation.Accuracy.High
          : ExpoLocation.Accuracy.Balanced,
        distanceInterval: mergedOptions.distanceFilter,
        timeInterval: 10000, // 10 seconds
      },
      (position) => {
        const formattedLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          altitude: position.coords.altitude ?? null,
          altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        };
        setLocation(formattedLocation);
      }
    );
  }, [hasLocationPermission, mergedOptions]);

  const stopWatching = useCallback((): void => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
    }
  }, []);

  const clearWatch = useCallback((): void => {
    stopWatching();
  }, [stopWatching]);

  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    location,
    error,
    isLoading,
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearWatch,
    hasLocationPermission,
  };
}

export default useLocation;
export { useLocation };
