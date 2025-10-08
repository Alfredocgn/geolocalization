export interface UploadProgress {
  uploadId: string;
  totalRows: number;
  processedRows: number;
  createdClients: number;
  skipped: number;
  errors: number;
  status: 'processing' | 'geocoding' | 'completed' | 'failed';
  geocodingProgress: {
    total: number;
    completed: number;
  };
}
