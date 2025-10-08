import React, { useState, useEffect } from "react";

import type { Client, CreateClientDto, UpdateClientDto } from "../../../types";
import { Button } from "../../common/Button";

interface ClientFormPropsCreate {
  client?: undefined;
  onSubmit: (data: CreateClientDto) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

interface ClientFormPropsUpdate {
  client: Client;
  onSubmit: (data: UpdateClientDto) => void | Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type ClientFormProps = ClientFormPropsCreate | ClientFormPropsUpdate;

export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    street: "",
    city: "",
    province: "",
    country: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        lastName: client.lastName,
        street: client.street,
        city: client.city,
        province: client.province,
        country: client.country,
      });
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={handleChange("name")}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={handleChange("lastName")}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Street and Number *
        </label>
        <input
          type="text"
          value={formData.street}
          onChange={handleChange("street")}
          className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            City *
          </label>
          <input
            type="text"
            value={formData.city}
            onChange={handleChange("city")}
            className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Province *
          </label>
          <input
            type="text"
            value={formData.province}
            onChange={handleChange("province")}
            className="w-full px-3 text-black  py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Country *
        </label>
        <input
          type="text"
          value={formData.country}
          onChange={handleChange("country")}
          className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="flex gap-2 pt-4 text-xs">
        <Button
          type="submit"
          variant="secondary"
          loading={loading}
          disabled={loading}
        >
          {client ? "Update" : "Create"} Client
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};
