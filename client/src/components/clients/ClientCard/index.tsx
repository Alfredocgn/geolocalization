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
            <span className="font-medium">Coordinates:</span> {client.latitude},{" "}
            {client.longitude}
          </p>
        )}
        {client.notes && (
          <p className="text-sm">
            <span className="font-medium">Notes:</span> {client.notes}
          </p>
        )}
      </div>
      {client.geocodingStatus === "ambiguous" && showGeocodingOptions && (
        <div className="mb-4">
          <GeocodingOptionsSelector
            client={client}
            onSelectResult={handleSelectGeocodingResult}
          />
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-2 mt-auto">
        <Button
          variant="secondary"
          size="xs"
          onClick={() => onEdit(client)}
          className="flex-1 min-w-[80px]"
        >
          ✏️ Edit
        </Button>

        {client.geocodingStatus === "ambiguous" && (
          <>
            <Button
              variant="secondary"
              size="xs"
              onClick={() => setShowGeocodingOptions(!showGeocodingOptions)}
              className="flex-1 min-w-[100px]"
            >
              {showGeocodingOptions ? "🔼 Hide" : "🔽 Options"}
            </Button>

            <Button
              variant="secondary"
              size="xs"
              onClick={() => setShowAddressForm(!showAddressForm)}
              className="flex-1 min-w-[100px]"
            >
              📍 Fix Address
            </Button>
          </>
        )}

        {(client.geocodingStatus === "failed" ||
          client.geocodingStatus === "ambiguous") && (
          <div className="w-full h-0"></div>
        )}

        <Button
          variant="danger"
          size="xs"
          onClick={() => onDelete(client.id)}
          className="flex-1 min-w-[80px]"
        >
          🗑️ Delete
        </Button>
      </div>

      {showAddressForm && (
        <form
          onSubmit={handleAddressSubmit}
          className="mt-4 p-4 bg-gray-50 rounded-md"
        >
          <h4 className="font-medium mb-3">Fix Address</h4>
          <div className="space-y-3">
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
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 text-black py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  setAddressForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4 text-xs">
            <Button type="submit" variant="secondary" size="small">
              Save
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => setShowAddressForm(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
