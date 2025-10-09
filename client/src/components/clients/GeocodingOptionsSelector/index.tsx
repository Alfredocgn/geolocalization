import React, { useState } from "react";

import { Button } from "../../common/Button";
import type { Client, GeocodingResult } from "../../../types";

interface GeocodingOptionsSelectorProps {
  client: Client;
  onSelectResult: (resultIndex: number) => void;
  loading?: boolean;
}

export const GeocodingOptionsSelector: React.FC<
  GeocodingOptionsSelectorProps
> = ({ client, onSelectResult, loading = false }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getGeocodingResults = (): GeocodingResult[] => {
    if (!client.geocodingResults) return [];

    // Con JSONB, el backend ya devuelve el objeto deserializado
    return Array.isArray(client.geocodingResults)
      ? client.geocodingResults
      : [client.geocodingResults];
  };

  const results = getGeocodingResults();

  const handleSelect = () => {
    if (selectedIndex !== null) {
      onSelectResult(selectedIndex);
    }
  };

  if (results.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-800 text-sm">No geocoding options found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
      <h4 className="font-medium text-yellow-800 mb-3">
        Select the correct location ({results.length} options):
      </h4>

      <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto pr-2">
        {results.map((result, index) => (
          <label
            key={index}
            className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
              selectedIndex === index
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <input
              type="radio"
              name={`geocoding-option-${client.id}`}
              value={index}
              checked={selectedIndex === index}
              onChange={() => setSelectedIndex(index)}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
            />

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Option {index + 1}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.display_name}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Lat: {result.latitude.toFixed(6)}</span>
                    <span>Lng: {result.longitude.toFixed(6)}</span>
                    <span>
                      Confidence:{" "}
                      {result.confidence
                        ? (result.confidence * 100).toFixed(1)
                        : "N/A"}
                      %
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-2 text-xs">
        <Button
          onClick={handleSelect}
          variant="secondary"
          size="small"
          disabled={selectedIndex === null || loading}
          loading={loading}
        >
          Confirm Selection
        </Button>

        {selectedIndex !== null && (
          <div className="text-xs text-gray-500 flex items-center">
            ✓ Option {selectedIndex + 1} selected
          </div>
        )}
      </div>
    </div>
  );
};
