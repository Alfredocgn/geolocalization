import React, { useEffect, useRef, useState } from "react";
import type {
  Client,
  CreateClientDto,
  UpdateClientDto,
  UpdateAddressDto,
} from "../../types";
import { useClients } from "../../hooks/useClients";
import { useFileUpload } from "../../hooks/useUpload";
import { ClientCard } from "../../components/clients/ClientCard";
import { ClientForm } from "../../components/clients/ClientForm";
import { FileUpload } from "../../components/upload/FileUpload";
import { Button } from "../../components/common/Button";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { ErrorAlert } from "../../components/common/ErrorAlert";
import { UploadProgress } from "../../components/upload/UploadProgress";

export const HomePage: React.FC = () => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [currentUploadId, setCurrentUploadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    clients,
    loading: clientsLoading,
    error: clientsError,
    createClient,
    updateClient,
    deleteClient,
    updateAddress,
    loadClients,
    selectGeocodingResult,
  } = useClients();

  const handleProgressComplete = () => {
    loadClients();
  };

  const {
    uploading,
    uploadResult,
    error: uploadError,
    uploadFile,
    clearResult,
  } = useFileUpload();

  const loadClientsRef = useRef(loadClients);
  useEffect(() => {
    loadClientsRef.current = loadClients;
  }, [loadClients]);

  const handleCreateClient = async (clientData: CreateClientDto) => {
    try {
      await createClient(clientData);
      setShowClientForm(false);
    } catch (error) {
      console.error("Error creating client:", error);
    }
  };
  const handleSelectGeocodingResult = async (
    id: string,
    resultIndex: number
  ) => {
    try {
      await selectGeocodingResult(id, resultIndex);
    } catch (error) {
      console.error("Error selecting geocoding result:", error);
    }
  };

  const handleUpdateClient = async (clientData: UpdateClientDto) => {
    if (!editingClient) return;

    try {
      const addressChanged =
        clientData.street !== editingClient.street ||
        clientData.city !== editingClient.city ||
        clientData.province !== editingClient.province ||
        clientData.country !== editingClient.country;

      if (addressChanged) {
        // Si cambió la dirección, usar updateAddress (que ahora acepta todos los campos)
        await updateAddress(editingClient.id, {
          name: clientData.name,
          lastName: clientData.lastName,
          street: clientData.street,
          city: clientData.city,
          province: clientData.province,
          country: clientData.country,
        });
      } else {
        // Si solo cambiaron datos personales, usar update normal
        await updateClient(editingClient.id, clientData);
      }

      setShowClientForm(false);
      setEditingClient(null);
    } catch (error) {
      console.error("Error updating client:", error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) {
      try {
        await deleteClient(id);
      } catch (error) {
        console.error("Error deleting client:", error);
      }
    }
  };

  const handleUpdateAddress = async (id: string, address: UpdateAddressDto) => {
    try {
      const response = await updateAddress(id, address);
      console.log("Response:", response);
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const result = await uploadFile(file);

      console.log("Upload result:", result); // Para debug

      if (result?.uploadId) {
        setCurrentUploadId(result.uploadId);
      }

      loadClients();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  useEffect(() => {
    if (!currentUploadId) return;

    const interval = setInterval(() => {
      loadClientsRef.current();
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUploadId]);

  // Filtrar clientes por término de búsqueda
  const filterClients = (clientsList: Client[]) => {
    if (!searchTerm.trim()) return clientsList;

    const term = searchTerm.toLowerCase();
    return clientsList.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.lastName.toLowerCase().includes(term) ||
        client.street.toLowerCase().includes(term) ||
        client.city.toLowerCase().includes(term) ||
        client.province.toLowerCase().includes(term) ||
        client.country.toLowerCase().includes(term)
    );
  };

  const clientsWithIssues = clients.filter(
    (client) =>
      client.geocodingStatus === "failed" ||
      client.geocodingStatus === "ambiguous"
  );

  const filteredClients = filterClients(clients);
  const filteredClientsWithIssues = filterClients(clientsWithIssues);

  return (
    <div className="min-h-screen  bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center text-center flex-col  ">
          <h1 className="text-2xl font-bold text-gray-900 px-8 text-center">
            Client Management System
          </h1>
          <p className="mt-2 text-gray-600 text-center">
            Manage your clients and geocode their addresses
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap justify-center items-center gap-4">
          <Button onClick={() => setShowClientForm(true)} variant="secondary">
            + New Client
          </Button>

          <Button onClick={() => setShowUploadForm(true)} variant="secondary">
            📁 Upload CSV
          </Button>

          {clientsWithIssues.length > 0 && (
            <Button onClick={() => {}} variant="secondary">
              ⚠️ {clientsWithIssues.length} Geocoding Issues Found
            </Button>
          )}
        </div>

        {/* Search Bar */}
        {clients.length > 0 && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 Search by name, address, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-600 text-center">
                Found {filteredClients.length} of {clients.length} clients
              </p>
            )}
          </div>
        )}

        {/* Client Form Modal */}
        {showClientForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingClient ? "Edit Client" : "New Client"}
                </h3>
                {editingClient ? (
                  <ClientForm
                    client={editingClient}
                    onSubmit={handleUpdateClient}
                    onCancel={() => {
                      setShowClientForm(false);
                      setEditingClient(null);
                    }}
                    loading={clientsLoading}
                  />
                ) : (
                  <ClientForm
                    onSubmit={handleCreateClient}
                    onCancel={() => {
                      setShowClientForm(false);
                      setEditingClient(null);
                    }}
                    loading={clientsLoading}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* File Upload Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Upload CSV File
                  </h3>
                  <button
                    onClick={() => {
                      setShowUploadForm(false);
                      clearResult();
                    }}
                    className="text-white hover:text-gray-600"
                  >
                    <svg
                      className="w-3 h-3"
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

                <FileUpload
                  onUpload={handleFileUpload}
                  loading={uploading}
                  uploadResult={uploadResult}
                  error={uploadError}
                  onClearResult={clearResult}
                />
              </div>
            </div>
          </div>
        )}
        {currentUploadId && (
          <UploadProgress
            uploadId={currentUploadId}
            onComplete={handleProgressComplete}
            onClose={() => setCurrentUploadId(null)}
          />
        )}

        {/* Error Messages */}
        {clientsError && <ErrorAlert message={clientsError} type="error" />}

        {/* Clients with Issues Section */}
        {filteredClientsWithIssues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Clients with Geocoding Issues ({filteredClientsWithIssues.length}
              {searchTerm && ` of ${clientsWithIssues.length}`})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {filteredClientsWithIssues.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={(client) => {
                    setEditingClient(client);
                    setShowClientForm(true);
                  }}
                  onDelete={handleDeleteClient}
                  onUpdateAddress={handleUpdateAddress}
                  onSelectGeocodingResult={handleSelectGeocodingResult}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Clients Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              All Clients ({filteredClients.length}
              {searchTerm && ` of ${clients.length}`})
            </h2>
            <div className="flex gap-2">
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm("")}
                  variant="secondary"
                  size="small"
                >
                  ✕ Clear
                </Button>
              )}
              <Button
                onClick={loadClients}
                variant="secondary"
                size="small"
                loading={clientsLoading}
              >
                🔄 Update
              </Button>
            </div>
          </div>

          {clientsLoading && clients.length === 0 ? (
            <LoadingSpinner text="Loading clients..." />
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No clients
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by creating a new client or uploading a CSV file.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setShowClientForm(true)}
                  variant="primary"
                >
                  + New Client
                </Button>
              </div>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No clients found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No clients match "{searchTerm}". Try a different search term.
              </p>
              <Button
                onClick={() => setSearchTerm("")}
                variant="secondary"
                size="small"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
              {filteredClients.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  onEdit={(client) => {
                    setEditingClient(client);
                    setShowClientForm(true);
                  }}
                  onDelete={handleDeleteClient}
                  onUpdateAddress={handleUpdateAddress}
                  onSelectGeocodingResult={handleSelectGeocodingResult}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
