import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../../stores/authStore";
import { useClientStore, Client } from "../../../stores/clientStore";
import { ClientsDataTable } from "./ClientsDataTable";
import { createClientsColumns } from "./ClientsColumns";
import ClientCreate from "./ClientCreate";
import ClientEdit from "./ClientEdit";
import ClientDelete from "./ClientDelete";

export default function ClientsIndex() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const {
    clients,
    clientsLoading,
    clientsPagination,
    clientsExporting,
    fetchClients,
    exportClients,
  } = useClientStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const isMounted = useRef(false);
  const perPage = 25;

  const canManageClients = currentUser?.roles.some((role) =>
    ["admin", "manager"].includes(role)
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isMounted.current) return;

    const load = async () => {
      try {
        await fetchClients(1, perPage, { search: searchTerm });
      } catch (error: any) {
        if (isMounted.current) {
          toast.error(error.message || "Error al cargar clientes");
        }
      }
    };

    load();
  }, [fetchClients, perPage, searchTerm]);

  const handleViewClick = (client: Client) => {
    navigate(`/dashboard/clients/${client.id}`);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  const handlePageChange = (selectedItem: { selected: number }) => {
    const page = selectedItem.selected + 1;
    fetchClients(page, perPage, { search: searchTerm });
  };

  const handleExportClients = async () => {
    try {
      await exportClients({ search: searchTerm });
      toast.success("Clientes exportados correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al exportar clientes");
    }
  };

  const columns = createClientsColumns({
    onView: handleViewClick,
    onEdit: handleEditClick,
    onDelete: handleDeleteClick,
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground">
          Gestiona tus clientes y sus proyectos
        </p>
      </div>

      <ClientsDataTable
        columns={columns}
        data={clients}
        onCreateClient={
          canManageClients ? () => setCreateModalOpen(true) : undefined
        }
        onExportClients={handleExportClients}
        isExporting={clientsExporting}
        onSearchChange={(term) => setSearchTerm(term)}
        onPageChange={clientsPagination ? handlePageChange : undefined}
        isLoading={clientsLoading}
        pagination={
          clientsPagination
            ? {
                currentPage: clientsPagination.current_page - 1,
                pageCount: clientsPagination.last_page,
                totalCount: clientsPagination.total,
                perPage: clientsPagination.per_page,
              }
            : undefined
        }
      />

      <ClientCreate
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => fetchClients(1, perPage, { search: searchTerm })}
      />

      {selectedClient && (
        <>
          <ClientEdit
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            client={selectedClient}
            onSuccess={() =>
              fetchClients(clientsPagination.current_page, perPage, {
                search: searchTerm,
              })
            }
          />
          <ClientDelete
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            client={selectedClient}
            onSuccess={() => fetchClients(1, perPage, { search: searchTerm })}
          />
        </>
      )}
    </div>
  );
}
