import React, { useState } from "react";

import type { Client, UpdateAddressDto } from "../../../types";
import { Button } from "../../common/Button";
import { GeocodingStatusBadge } from "../GeocodingStatusBadge";
import { GeocodingOptionsSelector } from "../GeocodingOptionsSelector";

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onUpdateAddress: (id: string, address: UpdateAddressDto) => void;
  onSelectGeocodingResult: (id: string, resultIndex: number) => void;
}

export const ClientCard: React.FC<ClientCardProps> = ({
  client,
  onEdit,
  onDelete,
  onUpdateAddress,
  onSelectGeocodingResult,
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [showGeocodingOptions, setShowGeocodingOptions] = useState(false);
  const [addressForm, setAddressForm] = useState({
    street: client.street,
    city: client.city,
    province: client.province,
    country: client.country,
    notes: client.notes || "",
  });

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAddress(client.id, addressForm);
    setShowAddressForm(false);
  };
  const handleSelectGeocodingResult = (resultIndex: number) => {
    onSelectGeocodingResult(client.id, resultIndex);
    setShowGeocodingOptions(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-black">
              {client.name} {client.lastName}
            </h3>
            <p className="text-sm text-gray-600">
              Created: {new Date(client.createdAt).toLocaleDateString()}
            </p>
          </div>
          <GeocodingStatusBadge status={client.geocodingStatus} />
        </div>

        <div className="space-y-2 mb-4 text-black flex-grow">
          <p className="text-sm ">
            <span className="font-medium">Address:</span> {client.street}
          </p>
          <p className="text-sm">
            <span className="font-medium">City:</span> {client.city},{" "}
            {client.province}, {client.country}
          </p>
          {client.latitude && client.longitude && (
            <p className="text-sm">
              <span className="font-medium">Coordinates:</span>{" "}
              {client.latitude}, {client.longitude}
            </p>
          )}
          {client.notes && (
            <p className="text-sm">
              <span className="font-medium">Notes:</span> {client.notes}
            </p>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="xs"
              onClick={() => onEdit(client)}
              className="flex-1"
            >
              ✏️ Edit
            </Button>

            <Button
              variant="danger"
              size="xs"
              onClick={() => onDelete(client.id)}
              className="flex-1"
            >
              🗑️ Delete
            </Button>
          </div>

          {client.geocodingStatus === "ambiguous" ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowGeocodingOptions(true)}
                className="flex-1"
              >
                🔽 Options
              </Button>

              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowAddressForm(true)}
                className="flex-1"
              >
                📍 Fix Address
              </Button>
            </div>
          ) : client.geocodingStatus === "failed" ? (
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setShowAddressForm(true)}
              className="w-full"
            >
              📍 Fix Address
            </Button>
          ) : null}
        </div>
      </div>

      {/* Modal for Geocoding Options */}
      {showGeocodingOptions && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Select Geocoding Option for {client.name} {client.lastName}
              </h3>
              <button
                onClick={() => setShowGeocodingOptions(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <GeocodingOptionsSelector
                client={client}
                onSelectResult={handleSelectGeocodingResult}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal for Fix Address */}
      {showAddressForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-lg">
              <h3 className="text-lg font-medium text-black">
                Fix Address for {client.name} {client.lastName}
              </h3>
              <button
                onClick={() => setShowAddressForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAddressSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Street and Height
                  </label>
                  <input
                    type="text"
                    value={addressForm.street}
                    onChange={(e) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        street: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      Province
                    </label>
                    <input
                      type="text"
                      value={addressForm.province}
                      onChange={(e) =>
                        setAddressForm((prev) => ({
                          ...prev,
                          province: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={addressForm.country}
                    onChange={(e) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    value={addressForm.notes}
                    onChange={(e) =>
                      setAddressForm((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="medium"
                  onClick={() => setShowAddressForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
