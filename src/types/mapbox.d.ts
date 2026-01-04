declare module '@mapbox/mapbox-sdk/services/geocoding' {
  import { MapiClient } from '@mapbox/mapbox-sdk/lib/classes/mapi-client';
  import { MapiRequest } from '@mapbox/mapbox-sdk/lib/classes/mapi-request';
  import { MapiResponse } from '@mapbox/mapbox-sdk/lib/classes/mapi-response';

  export interface GeocodeService {
    forwardGeocode(request: {
      query: string;
      limit?: number;
      proximity?: { longitude: number; latitude: number };
      types?: string[];
    }): MapiRequest<MapiResponse>;
  }

  export default function(config: { accessToken: string }): GeocodeService;
}
