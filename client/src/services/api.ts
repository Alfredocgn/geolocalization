import axios from "axios";

import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
  UpdateAddressDto,
  CsvUploadResponse,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

export const clientsService = {
  async getAll(): Promise<Client[]> {
    const response = await api.get<Client[]>("/clients");
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },
  async create(clientData: CreateClientDto): Promise<Client> {
    const response = await api.post<Client>("/clients", clientData);
    return response.data;
  },
  async update(id: string, clientData: UpdateClientDto): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}`, clientData);
    return response.data;
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
  async getWithGeocodingIssues(): Promise<Client[]> {
    const response = await api.get<Client[]>("/clients/issues");
    return response.data;
  },
  async geocode(id: string): Promise<Client> {
    const response = await api.post<Client>(`/clients/${id}/geocode`);
    return response.data;
  },
  async updateAddress(
    id: string,
    addressData: UpdateAddressDto
  ): Promise<Client> {
    const response = await api.patch<Client>(
      `/clients/${id}/address`,
      addressData
    );
    return response.data;
  },
  async selectGeocodingResult(
    id: string,
    resultIndex: number
  ): Promise<Client> {
    const response = await api.patch<Client>(`/clients/${id}/select-result`, {
      resultIndex,
    });
    return response.data;
  },
};

export const uploadService = {
  async uploadCsv(file: File): Promise<CsvUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<CsvUploadResponse>(
      "/upload/csv",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },
};

export default api;
