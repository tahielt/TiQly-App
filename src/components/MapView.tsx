import React, { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet, Platform, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region } from 'react-native-maps';
import ClusteredMapView from 'react-native-map-clustering';
import * as Location from 'expo-location';
import { Image } from 'react-native';

export interface MapViewHandle {
  centerOnUser: () => void;
  animateToEvent: (coordinates: { latitude: number; longitude: number }) => void;
  openDirections: (destination: { latitude: number; longitude: number }, label?: string) => void;
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
}

const customMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0A1418" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#00A5B8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#000000" }, { "weight": 2 }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#00505A" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#00D9FF" }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#0D2A33" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#0A2420" }, { "visibility": "on" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#0A3D4A" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#00707D" }, { "weight": 0.5 }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#00808F" }] },
  { "featureType": "road.local", "elementType": "geometry.fill", "stylers": [{ "color": "#0A3540" }] },
  { "featureType": "road.local", "elementType": "geometry.stroke", "stylers": [{ "color": "#005A65" }] },
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#0D4A52" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#00D9FF" }, { "weight": 1 }] },
  { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#0A4048" }] },
  { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#008A9A" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
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
}, ref) => {
  const mapRef = useRef<MapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region>({
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

      // Always center on user's real location (not hardcoded Bariloche)
      if (!initialLocation && location.coords) {
        const userRegion: Region = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        };
        setRegion(userRegion);

        // Animate to user location smoothly
        setTimeout(() => {
          mapRef.current?.animateToRegion(userRegion, 800);
        }, 500);
      }
    })();
  }, []);

  useImperativeHandle(ref, () => ({
    centerOnUser: () => {
      if (userLocation && mapRef.current) {
        mapRef.current.animateToRegion({
          ...userLocation,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 600);
      }
    },

    // Animate zoom to an event marker
    animateToEvent: (coordinates: { latitude: number; longitude: number }) => {
      if (mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }, 800);
      }
    },

    // Open real directions in Google Maps or Apple Maps
    openDirections: (destination: { latitude: number; longitude: number }, label?: string) => {
      const { latitude, longitude } = destination;
      const encodedLabel = encodeURIComponent(label || 'Evento');

      if (Platform.OS === 'ios') {
        // Try Google Maps first, fallback to Apple Maps
        const googleMapsUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
        const appleMapsUrl = `maps://app?daddr=${latitude},${longitude}&q=${encodedLabel}`;

        Linking.canOpenURL(googleMapsUrl).then((supported) => {
          if (supported) {
            Linking.openURL(googleMapsUrl);
          } else {
            Linking.openURL(appleMapsUrl);
          }
        });
      } else {
        // Android: Google Maps
        const googleMapsUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;
        const fallbackUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;

        Linking.canOpenURL(googleMapsUrl).then((supported) => {
          if (supported) {
            Linking.openURL(googleMapsUrl);
          } else {
            Linking.openURL(fallbackUrl);
          }
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

  const handleMarkerPress = (eventId: string, coordinates: { latitude: number; longitude: number }) => {
    // Animate zoom to the marker
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordinates.latitude - 0.002, // Offset to show card below
        longitude: coordinates.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      }, 600);
    }

    // Callback to parent
    if (onMarkerPress) {
      onMarkerPress(eventId);
    }
  };

  // Use ClusteredMapView for non-editable mode (event browsing), normal MapView for editable mode
  const MapComponent = (editable ? MapView : ClusteredMapView) as any;

  return (
    <View style={[styles.container, style]}>
      <MapComponent
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={customMapStyle}
        onPress={handlePress}
        // Clustering props (only used when ClusteredMapView)
        {...(!editable ? {
          clusterColor: '#00D9FF',
          clusterTextColor: '#000',
          clusterFontFamily: Platform.OS === 'ios' ? 'Helvetica-Bold' : 'sans-serif-bold',
          radius: 50,
          minZoomLevel: 0,
          maxZoomLevel: 20,
          animationEnabled: true,
        } : {})}
      >
        {events.map((event) => (
          <Marker
            key={event.id}
            coordinate={event.coordinates}
            onPress={() => handleMarkerPress(event.id, event.coordinates)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
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
      </MapComponent>
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
