
import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Polyline, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { Image } from 'react-native';

export interface MapViewHandle {
  centerOnUser: () => void;
}

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
  routeTo?: { latitude: number; longitude: number } | null;
}

// 🔥 Futuristic Neon Map Style - Cyberpunk aesthetic
const customMapStyle = [
  // Base oscura profunda
  { "elementType": "geometry", "stylers": [{ "color": "#0A1418" }] },

  // Sin íconos de POI para look limpio
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },

  // Labels cyan subtle
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#00A5B8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "weight": 2 }] },

  // Administrative borders cyan
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#00505A" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#00D9FF" }] },

  // Landscape teal oscuro
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#0D2A33" }] },

  // POIs ocultos para look minimalista
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },

  // Parques teal oscuro
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#0A2420" }, { "visibility": "on" }] },

  // 🔥 CALLES NEÓN - El secreto del look futurista
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#0A3D4A" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#00707D" }, { "weight": 0.5 }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#00808F" }] },

  // Calles locales
  { "featureType": "road.local", "elementType": "geometry.fill", "stylers": [{ "color": "#0A3540" }] },
  { "featureType": "road.local", "elementType": "geometry.stroke", "stylers": [{ "color": "#005A65" }] },

  // Highways más brillantes con glow cyan
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#0D4A52" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#00D9FF" }, { "weight": 1 }] },

  // Arterial roads
  { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#0A4048" }] },
  { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#008A9A" }] },

  // Transit oculto
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },

  // Agua negra profunda
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000508" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#004555" }] }
];

const CustomMapView = forwardRef<MapViewHandle, MapViewProps>(({
  initialLocation,
  onLocationChange,
  onMarkerPress,
  events = [],
  editable = false,
  style,
  routeTo
}, ref) => {
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

      if (!initialLocation && location.coords) {
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0021,
        });
      }
    })();
  }, []);

  // Fit map to show route
  useEffect(() => {
    if (routeTo && userLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([userLocation, routeTo], {
        edgePadding: { top: 200, right: 60, bottom: 280, left: 60 },
        animated: true
      });
    }
  }, [routeTo, userLocation]);

  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion({
          ...userLocation,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0021,
        });
      }
    }
  }));

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
        showsMyLocationButton={false}
        customMapStyle={customMapStyle}
        onPress={handlePress}
      >
        {/* Event Markers */}
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.coordinates}
            onPress={() => onMarkerPress && onMarkerPress(event.id)}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('../../assets/icono.png')}
                style={styles.markerIcon}
                resizeMode="contain"
              />
            </View>
          </Marker>
        ))}

        {/* Editable Pin */}
        {editable && initialLocation && (
          <Marker
            coordinate={{ latitude: initialLocation.latitude, longitude: initialLocation.longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerContainer}>
              <Image
                source={require('../../assets/icono.png')}
                style={styles.markerIcon}
                resizeMode="contain"
              />
            </View>
          </Marker>
        )}

        {/* Route Line - Improved visual */}
        {routeTo && userLocation && (
          <>
            {/* Glow effect */}
            <Polyline
              coordinates={[userLocation, routeTo]}
              strokeColor="rgba(0, 217, 255, 0.25)"
              strokeWidth={12}
            />
            {/* Main line */}
            <Polyline
              coordinates={[userLocation, routeTo]}
              strokeColor="#00D9FF"
              strokeWidth={4}
              lineCap="round"
            />
            {/* Destination circle */}
            <Circle
              center={routeTo}
              radius={50}
              fillColor="rgba(0, 217, 255, 0.2)"
              strokeColor="#00D9FF"
              strokeWidth={2}
            />
          </>
        )}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000'
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 48,
  },
  markerIcon: {
    width: 40,
    height: 48,
  },
});

export default CustomMapView;
