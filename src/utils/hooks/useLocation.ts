import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
};

type LocationError = {
  code: string;
  message: string;
};

type UseLocationOptions = {
  enableHighAccuracy?: boolean;
  distanceFilter?: number;
};

const defaultOptions: UseLocationOptions = {
  enableHighAccuracy: true,
  distanceFilter: 10,
};

function useLocation(options: UseLocationOptions = {}) {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const subscription = useRef<Location.LocationSubscription | null>(null);

  const mergedOptions = { ...defaultOptions, ...options };

  const hasLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      setError({ code: 'PERMISSION_ERROR', message: 'Failed to request permission' });
      return false;
    }
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<LocationData | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await hasLocationPermission();
      if (!hasPermission) {
        setError({ code: 'PERMISSION_DENIED', message: 'Location permission denied' });
        setIsLoading(false);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: mergedOptions.enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
        altitude: position.coords.altitude ?? null,
        heading: position.coords.heading ?? null,
        speed: position.coords.speed ?? null,
        timestamp: position.timestamp,
      };

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (e) {
      const err = e as Error;
      setError({ code: 'LOCATION_ERROR', message: err.message });
      setIsLoading(false);
      return null;
    }
  }, [hasLocationPermission, mergedOptions.enableHighAccuracy]);

  const startWatching = useCallback(async (): Promise<void> => {
    if (subscription.current) return;

    const hasPermission = await hasLocationPermission();
    if (!hasPermission) return;

    subscription.current = await Location.watchPositionAsync(
      {
        accuracy: mergedOptions.enableHighAccuracy
          ? Location.Accuracy.High
          : Location.Accuracy.Balanced,
        distanceInterval: mergedOptions.distanceFilter,
      },
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          altitude: position.coords.altitude ?? null,
          heading: position.coords.heading ?? null,
          speed: position.coords.speed ?? null,
          timestamp: position.timestamp,
        });
      }
    );
  }, [hasLocationPermission, mergedOptions]);

  const stopWatching = useCallback((): void => {
    if (subscription.current) {
      subscription.current.remove();
      subscription.current = null;
    }
  }, []);

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
    hasLocationPermission,
  };
}

export default useLocation;
