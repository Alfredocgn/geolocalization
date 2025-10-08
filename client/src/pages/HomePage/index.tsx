import React, { useState } from "react";
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

export const HomePage: React.FC = () => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

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

  const {
    uploading,
    uploadResult,
    error: uploadError,
    uploadFile,
    clearResult,
  } = useFileUpload();

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
      await updateClient(editingClient.id, clientData);
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
      await updateAddress(id, address);
    } catch (error) {
      console.error("Error updating address:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      await uploadFile(file);

      loadClients();
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const clientsWithIssues = clients.filter(
    (client) =>
      client.geocodingStatus === "failed" ||
      client.geocodingStatus === "ambiguous"
  );

  return (
    <div className="min-h-screen  bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center flex-col">
          <h1 className="text-3xl font-bold text-gray-900">
            Client Management System
          </h1>
          <p className="mt-2 text-gray-600">
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
                    className="text-gray-400 hover:text-gray-600"
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

        {/* Error Messages */}
        {clientsError && <ErrorAlert message={clientsError} type="error" />}

        {/* Clients with Issues Section */}
        {clientsWithIssues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Clients with Geocoding Issues ({clientsWithIssues.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientsWithIssues.map((client) => (
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
              All Clients ({clients.length})
            </h2>
            <Button
              onClick={loadClients}
              variant="secondary"
              size="small"
              loading={clientsLoading}
            >
              🔄 Update
            </Button>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clients.map((client) => (
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
