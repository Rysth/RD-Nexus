import { useEffect, useState } from "react";
import { useClientStore, Client } from "../../../stores/clientStore";
import { toast } from "react-hot-toast";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { Badge } from "../../../components/ui/badge";
import {
  MoreHorizontal,
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ClientCreate from "./ClientCreate";
import ClientEdit from "./ClientEdit";
import ClientDelete from "./ClientDelete";

export default function ClientsIndex() {
  const navigate = useNavigate();
  const { clients, clientsLoading, clientsPagination, fetchClients } =
    useClientStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async (page = 1) => {
    try {
      await fetchClients(page, 25, { search: searchTerm });
    } catch {
      toast.error("Error al cargar clientes");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadClients(1);
  };

  const handleEditClick = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client);
    setDeleteModalOpen(true);
  };

  const handleViewClick = (client: Client) => {
    navigate(`/dashboard/clients/${client.id}`);
  };

  const getIdTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      "04": "bg-blue-100 text-blue-800",
      "05": "bg-green-100 text-green-800",
      "06": "bg-purple-100 text-purple-800",
    };
    const labels: Record<string, string> = {
      "04": "RUC",
      "05": "Cédula",
      "06": "Pasaporte",
    };
    return (
      <Badge className={colors[type] || "bg-gray-100 text-gray-800"}>
        {labels[type] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tus clientes y sus proyectos
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, identificación o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo ID</TableHead>
              <TableHead>Identificación</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientsLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>
                    {getIdTypeBadge(client.identification_type)}
                  </TableCell>
                  <TableCell>{client.identification}</TableCell>
                  <TableCell>{client.email || "-"}</TableCell>
                  <TableCell>{client.phone || "-"}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewClick(client)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditClick(client)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(client)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {clientsPagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {clients.length} de {clientsPagination.total} clientes
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={clientsPagination.current_page === 1}
              onClick={() => loadClients(clientsPagination.current_page - 1)}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={
                clientsPagination.current_page === clientsPagination.last_page
              }
              onClick={() => loadClients(clientsPagination.current_page + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ClientCreate
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={() => loadClients(1)}
      />

      {selectedClient && (
        <>
          <ClientEdit
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            client={selectedClient}
            onSuccess={() => loadClients(clientsPagination.current_page)}
          />
          <ClientDelete
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            client={selectedClient}
            onSuccess={() => loadClients(1)}
          />
        </>
      )}
    </div>
  );
}
