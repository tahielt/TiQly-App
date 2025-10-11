import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation, {
  GeoPosition,
  GeoError,
  GeoOptions,
  GeoWatchOptions,
} from 'react-native-geolocation-service';

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
  maximumAge?: number;
  distanceFilter?: number;
  useSignificantChanges?: boolean;
  showsBackgroundLocationIndicator?: boolean;
  forceRequestLocation?: boolean;
  forceLocationManager?: boolean;
  locationProvider?: 'playServices' | 'android' | 'auto' | 'fused';
};

const defaultOptions: UseLocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceFilter: 10,
  useSignificantChanges: false,
  showsBackgroundLocationIndicator: false,
  forceRequestLocation: false,
  forceLocationManager: false,
  locationProvider: 'auto',
};

/**
 * A custom hook that provides geolocation functionality.
 * @param {UseLocationOptions} options - Configuration options for location requests.
 * @returns {Object} An object containing location data and control functions.
 *
 * @example
 * function LocationTracker() {
 *   const {
 *     location,
 *     error,
 *     isLoading,
 *     getCurrentPosition,
 *     startWatching,
 *     stopWatching,
 *     clearWatch,
 *     hasLocationPermission,
 *   } = useLocation();
 *
 *   useEffect(() => {
 *     // Request location permission and get current position
 *     const init = async () => {
 *       const hasPermission = await hasLocationPermission();
 *       if (hasPermission) {
 *         await getCurrentPosition();
 *         startWatching();
 *       }
 *     };
 *
 *     init();
 *
 *     return () => {
 *       stopWatching();
 *     };
 *   }, []);
 *
 *   if (isLoading) {
 *     return <ActivityIndicator />;
 *   }
 *
 *   if (error) {
 *     return <Text>Error: {error.message}</Text>;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Latitude: {location?.latitude}</Text>
 *       <Text>Longitude: {location?.longitude}</Text>
 *       <Text>Accuracy: {location?.accuracy}m</Text>
 *     </View>
 *   );
 * }
 */
function useLocation(options: UseLocationOptions = {}) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<LocationError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const watchId = useRef<number | null>(null);

  const mergedOptions = useMemo(
    () => ({
      ...defaultOptions,
      ...options,
    }),
    [options]
  );


  const hasLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      const status = await Geolocation.requestAuthorization('whenInUse');
      return status === 'granted';
    }

    if (Platform.OS === 'android' && Platform.Version < 23) {
      return true;
    }

    const hasPermission = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (hasPermission) {
      return true;
    }

    const status = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (status === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    if (status === PermissionsAndroid.RESULTS.DENIED) {
      setError({
        code: 1,
        message: 'Location permission denied by user',
      });
    } else if (status === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      setError({
        code: 2,
        message: 'Location permission denied - must be enabled in app settings',
      });
    }

    return false;
  }, []);

  const getCurrentPosition = useCallback(async (): Promise<Location | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const hasPermission = await hasLocationPermission();
      if (!hasPermission) {
        return null;
      }

      return new Promise((resolve, reject) => {
        Geolocation.getCurrentPosition(
          (position: GeoPosition) => {
            const location = formatPosition(position);
            setLocation(location);
            setIsLoading(false);
            resolve(location);
          },
          (error: GeoError) => {
            const locationError = formatError(error);
            setError(locationError);
            setIsLoading(false);
            reject(locationError);
          },
          {
            enableHighAccuracy: mergedOptions.enableHighAccuracy,
            timeout: mergedOptions.timeout,
            maximumAge: mergedOptions.maximumAge,
            distanceFilter: mergedOptions.distanceFilter,
            useSignificantChanges: mergedOptions.useSignificantChanges,
            showLocationDialog: true,
            forceRequestLocation: mergedOptions.forceRequestLocation,
            forceLocationManager: mergedOptions.forceLocationManager,
          } as GeoOptions
        );
      });
    } catch (error) {
      const locationError = formatError(error as GeoError);
      setError(locationError);
      setIsLoading(false);
      return null;
    }
  }, [hasLocationPermission, mergedOptions]);

  const startWatching = useCallback((): void => {
    if (watchId.current !== null) {
      return;
    }

    const watchOptions: GeoWatchOptions = {
      enableHighAccuracy: mergedOptions.enableHighAccuracy,
      distanceFilter: mergedOptions.distanceFilter,
      useSignificantChanges: mergedOptions.useSignificantChanges,
      interval: 10000, // 10 seconds
      fastestInterval: 5000, // 5 seconds
      showLocationDialog: true,
      forceRequestLocation: mergedOptions.forceRequestLocation,
      forceLocationManager: mergedOptions.forceLocationManager,
    };

    watchId.current = Geolocation.watchPosition(
      (position: GeoPosition) => {
        setLocation(formatPosition(position));
      },
      (error: GeoError) => {
        setError(formatError(error));
      },
      watchOptions
    );
  }, [mergedOptions]);

  const stopWatching = useCallback((): void => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const clearWatch = useCallback((): void => {
    Geolocation.stopObserving();
    watchId.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopWatching();
      clearWatch();
    };
  }, [clearWatch, stopWatching]);

  // Format position to our Location type
  const formatPosition = (position: GeoPosition): Location => ({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    altitude: position.coords.altitude ?? null,
    altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
    heading: position.coords.heading ?? null,
    speed: position.coords.speed ?? null,
    timestamp: position.timestamp,
  });

  // Format error to our LocationError type
  const formatError = (error: GeoError): LocationError => ({
    code: error.code,
    message: error.message,
  });

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
