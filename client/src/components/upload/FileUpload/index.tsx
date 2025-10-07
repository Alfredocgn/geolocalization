import React, { useRef } from "react";
import { ErrorAlert } from "../../common/ErrorAlert";
import type { CsvUploadResponse } from "../../../types";

interface FileUploadProps {
  onUpload: (file: File) => void;
  loading: boolean;
  uploadResult?: CsvUploadResponse | null;
  error?: string | null;
  onClearResult?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  loading,
  uploadResult,
  error,
  onClearResult,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.toLowerCase().endsWith(".csv")) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Clients from CSV
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop a CSV file or click to select
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          loading
            ? "border-blue-300 bg-blue-50"
            : "border-gray-300 hover:border-gray-400 cursor-pointer"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={!loading ? openFileDialog : undefined}
      >
        <div className="space-y-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {loading ? (
            <div>
              <p className="text-blue-600 font-medium">Processing file...</p>
              <p className="text-sm text-gray-500 mt-1">
                This may take a few moments
              </p>
            </div>
          ) : (
            <div>
              <p className="text-gray-600">
                <span className="font-medium text-blue-600">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Only CSV files (maximum 10MB)
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
          disabled={loading}
        />
      </div>

      {error && (
        <ErrorAlert message={error} onClose={onClearResult} type="error" />
      )}

      {uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-green-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Load Completed
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Files Processed: {uploadResult.processed}</li>
                  <li>
                    Clientes created successfully: {uploadResult.successful}
                  </li>
                  <li>Errors found: {uploadResult.failed}</li>
                </ul>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-medium">Errores:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={onClearResult}
                className="inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-green-50 focus:ring-green-600"
              >
                <span className="sr-only">Dismiss</span>
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
