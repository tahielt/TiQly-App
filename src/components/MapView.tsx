
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

interface MapViewProps {
  initialLocation?: { latitude: number; longitude: number; zoom?: number };
  onLocationChange?: (location: { latitude: number; longitude: number }) => void;
  onMarkerPress?: (eventId: string) => void;
  events?: Array<{
    id: string;
    title: string;
    coordinates: { latitude: number; longitude: number };
    image?: string;
  }>;
  editable?: boolean;
  style?: any;
  routeTo?: { latitude: number; longitude: number } | null; // Destination for routing
}

const CustomMapView: React.FC<MapViewProps> = ({
  initialLocation,
  onLocationChange,
  onMarkerPress,
  events = [],
  editable = false,
  style,
  routeTo
}) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || -41.133472,
    longitude: initialLocation?.longitude || -71.310278,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location.coords);

      // Center on user initially if no initial location provided
      if (!initialLocation && location.coords) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    })();
  }, []);

  // Effect to fit elements if route is active
  useEffect(() => {
    if (routeTo && userLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([userLocation, routeTo], {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true
      });
    }
  }, [routeTo, userLocation]);

  const handlePress = (e: any) => {
    if (editable && onLocationChange) {
      const { coordinate } = e.nativeEvent;
      onLocationChange(coordinate);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        onPress={handlePress}
      >
        {/* Events Markers */}
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.coordinates}
            title={event.title}
            onPress={() => onMarkerPress && onMarkerPress(event.id)}
            pinColor="#D4FF00"
          />
        ))}

        {/* Editable Pin */}
        {editable && initialLocation && (
          <Marker
            coordinate={{ latitude: initialLocation.latitude, longitude: initialLocation.longitude }}
            pinColor="#D4FF00"
          />
        )}

        {/* Route Line */}
        {routeTo && userLocation && (
          <Polyline
            coordinates={[userLocation, routeTo]}
            strokeColor="#D4FF00"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#111'
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default CustomMapView;
