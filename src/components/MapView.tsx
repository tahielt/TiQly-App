import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Mapbox, { Camera, UserLocation, PointAnnotation } from '@rnmapbox/maps';
import { Ionicons } from '@expo/vector-icons';
import { MAPBOX_ACCESS_TOKEN, MAPBOX_STYLE, DEFAULT_LOCATION, MapLocation } from '../config/mapbox';
import * as Location from 'expo-location';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

interface MapViewProps {
  initialLocation?: MapLocation;
  onLocationChange?: (location: MapLocation) => void;
  onMarkerPress?: (eventId: string) => void;
  events?: Array<{
    id: string;
    title: string;
    coordinates: [number, number];
    image?: string;
  }>;
  showUserLocation?: boolean;
  style?: any;
}

export const MapView: React.FC<MapViewProps> = ({
  initialLocation,
  onLocationChange,
  onMarkerPress,
  events = [],
  showUserLocation = true,
  style,
}) => {
  const camera = useRef<Camera>(null);
  const [currentLocation, setCurrentLocation] = useState<MapLocation>(
    initialLocation || DEFAULT_LOCATION
  );

  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
      camera.current?.setCamera({
        centerCoordinate: [initialLocation.longitude, initialLocation.latitude],
        zoomLevel: initialLocation.zoom || 12,
        animationDuration: 500,
      });
    }
  }, [initialLocation]);

  useEffect(() => {
    if (showUserLocation) {
      getUserLocation();
    }
  }, [showUserLocation]);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Permiso de ubicación no otorgado');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      if (location) {
        const newLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          zoom: 14,
        };
        setCurrentLocation(newLocation);
        onLocationChange?.(newLocation);
      }
    } catch (error) {
      console.error('Error al obtener la ubicación:', error);
    }
  };

  const handleMapPress = async (e: any) => {
    const { geometry } = e;
    const newLocation = {
      latitude: geometry.coordinates[1],
      longitude: geometry.coordinates[0],
      zoom: currentLocation.zoom || 12,
    };
    setCurrentLocation(newLocation);
    onLocationChange?.(newLocation);
  };

  const handleMarkerPress = (eventId: string) => {
    onMarkerPress?.(eventId);
  };

  return (
    <View style={[styles.container, style]}>
      <Mapbox.MapView
        style={styles.map}
        styleURL={MAPBOX_STYLE}
        onPress={handleMapPress}
        logoEnabled={false}
        attributionEnabled={false}
      >
        <Camera
          ref={camera}
          centerCoordinate={[currentLocation.longitude, currentLocation.latitude]}
          zoomLevel={currentLocation.zoom || 12}
          animationMode={'flyTo'}
          animationDuration={0}
        />

        {showUserLocation && (
          <UserLocation
            visible={true}
            showsUserHeadingIndicator={true}
          />
        )}

        {events.map((event) => (
          <PointAnnotation
            key={event.id}
            id={event.id}
            coordinate={event.coordinates}
            onSelected={() => handleMarkerPress(event.id)}
          >
            <View style={styles.markerContainer}>
              <View style={styles.marker}>
                {event.image ? (
                  <Image 
                    source={{ uri: event.image }} 
                    style={styles.markerImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.markerIcon}>
                    <Ionicons name="location" size={20} color="white" />
                  </View>
                )}
              </View>
              <View style={styles.markerTextContainer}>
                <Text style={styles.markerText} numberOfLines={1}>
                  {event.title}
                </Text>
              </View>
            </View>
          </PointAnnotation>
        ))}
      </Mapbox.MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3182CE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  markerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3182CE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerTextContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    maxWidth: 150,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A202C',
  },
});

export default MapView;
