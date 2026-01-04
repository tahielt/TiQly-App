import mbxGeocoding, { GeocodeService } from '@mapbox/mapbox-sdk/services/geocoding';
import { MAPBOX_ACCESS_TOKEN } from '../config/mapbox';
import * as Location from 'expo-location';

export interface EventLocation {
  id: string;
  name: string;
  address: string;
  coordinates: [number, number];
  type: 'event' | 'venue' | 'landmark';
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  text: string;
  place_name: string;
  center: [number, number];
  relevance: number;
  address?: string;
  category?: string;
}

class MapService {
  private client: GeocodeService;

  constructor() {
    this.client = mbxGeocoding({ accessToken: MAPBOX_ACCESS_TOKEN });
  }

  async searchPlaces(query: string, proximity?: [number, number]): Promise<SearchResult[]> {
    try {
      const response = await this.client.forwardGeocode({
        query,
        limit: 5,
        proximity: proximity ? { longitude: proximity[0], latitude: proximity[1] } : undefined,
        types: ['address', 'poi', 'neighborhood', 'place'],
      } as any).send();

      return (response.body as any).features.map((feature: any) => ({
        id: feature.id,
        text: feature.text,
        place_name: feature.place_name,
        center: feature.center as [number, number],
        relevance: feature.relevance,
        address: feature.place_name,
      }));
    } catch (error) {
      console.error('Error al buscar lugares:', error);
      return [];
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Permiso de ubicación no otorgado');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return location;
    } catch (error) {
      console.error('Error al obtener la ubicación actual:', error);
      return null;
    }
  }

  async getDirections(origin: [number, number], destination: [number, number]) {
    try {
      const response = await (this.client as any).directions
        .getDirections({
          waypoints: [
            { coordinates: [origin[0], origin[1]] },
            { coordinates: [destination[0], destination[1]] },
          ],
          profile: 'driving',
          geometries: 'geojson',
        })
        .send();

      return response.body.routes[0];
    } catch (error) {
      console.error('Error al obtener direcciones:', error);
      return null;
    }
  }

  async getPlaceDetails(placeId: string): Promise<SearchResult | null> {
    try {
      const response = await this.client.forwardGeocode({
        query: placeId,
        limit: 1,
      } as any).send();

      if ((response.body as any).features.length === 0) {
        return null;
      }

      const feature = (response.body as any).features[0];
      return {
        id: feature.id,
        text: feature.text,
        place_name: feature.place_name,
        center: feature.center as [number, number],
        relevance: feature.relevance,
        address: feature.place_name,
      };
    } catch (error) {
      console.error('Error al obtener detalles del lugar:', error);
      return null;
    }
  }
}

export const mapService = new MapService();
