
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
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

const customMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#212121" }]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{ "color": "#203F4E" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#1C3744" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#2c2c2c" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#3c3c3c" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#000000" }]
  }
];

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
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0021,
        });
      }
    })();
  }, []);

  // Effect to fit elements if route is active
  useEffect(() => {
    if (routeTo && userLocation && mapRef.current) {
      mapRef.current.fitToCoordinates([userLocation, routeTo], {
        edgePadding: { top: 100, right: 100, bottom: 250, left: 100 },
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
        showsMyLocationButton={false}
        customMapStyle={customMapStyle}
        onPress={handlePress}
      >
        {/* Events Markers */}
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.coordinates}
            onPress={() => onMarkerPress && onMarkerPress(event.id)}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={32} color="#00D9FF" />
            </View>
          </Marker>
        ))}

        {/* Editable Pin */}
        {editable && initialLocation && (
          <Marker
            coordinate={{ latitude: initialLocation.latitude, longitude: initialLocation.longitude }}
            pinColor="#00D9FF"
          />
        )}

        {/* Route Line */}
        {routeTo && userLocation && (
          <Polyline
            coordinates={[userLocation, routeTo]}
            strokeColor="#00D9FF"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

      </MapView>

      {/* Custom Locate Button */}
      {!editable && (
        <TouchableOpacity
          style={styles.locateButton}
          onPress={() => {
            if (userLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                ...userLocation,
                latitudeDelta: 0.0122,
                longitudeDelta: 0.0021,
              });
            }
          }}
        >
          <Ionicons name="navigate" size={24} color="#00D9FF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

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
  },
  locateButton: {
    position: 'absolute',
    bottom: 250,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00D9FF',
  }
});

export default CustomMapView;
