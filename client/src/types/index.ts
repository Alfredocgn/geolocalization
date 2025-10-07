export interface Client {
  id: string;
  name: string;
  lastName: string;
  street: string;
  city: string;
  province: string;
  country: string;
  latitude?: number;
  longitude?: number;
  geocodingStatus: "pending" | "success" | "ambiguous" | "failed";
  geocodingResults?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientDto {
  name: string;
  lastName: string;
  street: string;
  city: string;
  province: string;
  country: string;
}

export interface UpdateClientDto {
  name?: string;
  lastName?: string;
  street?: string;
  city?: string;
  province?: string;
  country?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  display_name: string;
  confidence: number;
}

export interface GeocodingResponse {
  results: GeocodingResult[];
}

export interface UpdateAddressDto {
  street?: string;
  city?: string;
  province?: string;
  country?: string;
  notes?: string;
}

export interface SelectGeocodingResultDto {
  resultIndex: number;
}

export interface CsvUploadResponse {
  message: string;
  processed: number;
  successful: number;
  failed: number;
  errors?: string[];
}

export interface AppState {
  clients: Client[];
  loading: boolean;
  error: string | null;
}

export interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onGeocode: (id: string) => void;
  onUpdateAddress: (id: string, address: UpdateAddressDto) => void;
}

export interface UploadFormProps {
  onUpload: (file: File) => void;
  loading: boolean;
}
