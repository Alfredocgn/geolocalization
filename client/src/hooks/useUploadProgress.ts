import { useState, useEffect, useCallback, useRef } from "react";

interface UploadProgress {
  uploadId: string;
  totalRows: number;
  processedRows: number;
  createdClients: number;
  skipped: number;
  errors: number;
  status: "processing" | "geocoding" | "completed" | "failed";
  geocodingProgress: {
    total: number;
    completed: number;
  };
}

interface UseUploadProgressOptions {
  enabled?: boolean;
  interval?: number;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function useUploadProgress(
  uploadId: string | null,
  options: UseUploadProgressOptions = {}
) {
  const { enabled = true, interval = 2000, onComplete, onError } = options;

  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStatusRef = useRef<string | null>(null);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCompleteRef.current = options.onComplete;
    onErrorRef.current = options.onError;
  }, [options.onComplete, options.onError]);

  const fetchProgress = useCallback(async () => {
    if (!uploadId || !enabled) return;

    try {
      setIsLoading(true);
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000"
        }/upload/progress/${uploadId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch progress: ${response.statusText}`);
      }

      const data: UploadProgress = await response.json();
      setProgress(data);
      setError(null);

      if (
        data.status === "completed" &&
        previousStatusRef.current !== "completed"
      ) {
        onCompleteRef.current?.();
      }

      previousStatusRef.current = data.status;

      if (data.status === "completed" || data.status === "failed") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      setError(error);
      onErrorRef.current?.(error);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  }, [uploadId, enabled]);

  useEffect(() => {
    if (!uploadId || !enabled) {
      return;
    }

    fetchProgress();

    intervalRef.current = setInterval(() => {
      fetchProgress();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [uploadId, enabled, interval, fetchProgress]);

  return {
    progress,
    isLoading,
    error,
    refetch: fetchProgress,
  };
}
