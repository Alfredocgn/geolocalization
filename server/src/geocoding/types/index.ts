export interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance?: number;
  place_id?: string;
  osm_type?: string;
  osm_id?: string;
  type?: string;
  class?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  confidence: number;
}

export type GeocodingStatus = 'pending' | 'success' | 'ambiguous' | 'failed';
