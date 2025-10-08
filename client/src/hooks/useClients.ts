import { useCallback, useEffect, useState } from "react";
import type {
  Client,
  CreateClientDto,
  UpdateAddressDto,
  UpdateClientDto,
} from "../types";
import { clientsService } from "../services/api";

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientsService.getAll();
      setClients(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error loading clients"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const createClient = useCallback(async (clientData: CreateClientDto) => {
    setLoading(true);
    setError(null);
    try {
      const newClient = await clientsService.create(clientData);
      setClients((prev) => [...prev, newClient]);
      return newClient;
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Error creating client"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const updateClient = useCallback(
    async (id: string, clientData: UpdateClientDto) => {
      console.log("🚀 useClients.updateClient called");
      console.log("ID:", id);
      console.log("Client Data:", clientData);
      setLoading(true);
      setError(null);
      try {
        const updatedClient = await clientsService.update(id, clientData);
        console.log("✅ Response from API:", updatedClient);
        setClients((prev) =>
          prev.map((client) => (client.id === id ? updatedClient : client))
        );
        return updatedClient;
      } catch (error) {
        console.error("❌ Error updating client:", error);
        setError(
          error instanceof Error ? error.message : "Error updating client"
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await clientsService.delete(id);
      setClients((prev) => prev.filter((client) => client.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting client");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAddress = useCallback(
    async (id: string, addressData: UpdateAddressDto) => {
      setLoading(true);
      setError(null);
      try {
        const updatedClient = await clientsService.updateAddress(
          id,
          addressData
        );
        setClients((prev) =>
          prev.map((client) => (client.id === id ? updatedClient : client))
        );
        return updatedClient;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al actualizar dirección"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const selectGeocodingResult = useCallback(
    async (id: string, resultIndex: number) => {
      setLoading(true);
      setError(null);
      try {
        const updatedClient = await clientsService.selectGeocodingResult(
          id,
          resultIndex
        );
        setClients((prev) =>
          prev.map((client) => (client.id === id ? updatedClient : client))
        );
        return updatedClient;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al seleccionar resultado"
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  return {
    clients,
    loading,
    error,
    loadClients,
    createClient,
    updateClient,
    deleteClient,

    updateAddress,
    selectGeocodingResult,
  };
};
