import { useState, useCallback } from "react";
import type { CsvUploadResponse } from "../types";
import { uploadService } from "../services/api";

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<CsvUploadResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("El archivo debe ser un CSV");
      }

      const result = await uploadService.uploadCsv(file);
      setUploadResult(result);
      return result;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar archivo";
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setUploadResult(null);
    setError(null);
  }, []);

  return {
    uploading,
    uploadResult,
    error,
    uploadFile,
    clearResult,
  };
};
