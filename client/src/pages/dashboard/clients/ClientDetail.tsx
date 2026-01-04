import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClientStore, Project, Client } from "../../../stores/clientStore";
import { useAuthStore } from "../../../stores/authStore";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
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
import ProjectCreate from "./ProjectCreate";
import ProjectEdit from "./ProjectEdit";
import ProjectDelete from "./ProjectDelete";
import ClientEdit from "./ClientEdit";

const idTypeLabels: Record<string, string> = {
  "04": "RUC",
  "05": "Cédula",
  "06": "Pasaporte",
};

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  maintenance: "bg-blue-100 text-blue-800",
  canceled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  active: "Activo",
  maintenance: "Mantenimiento",
  canceled: "Cancelado",
};

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const {
    fetchClient,
    currentClient,
    clientsLoading,
    fetchProjectsByClient,
    projects,
  } = useClientStore();

  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editClientOpen, setEditClientOpen] = useState(false);

  const canManageClients = currentUser?.roles.some((role) =>
    ["admin", "manager"].includes(role)
  );

  useEffect(() => {
    if (id) {
      fetchClient(Number(id));
      fetchProjectsByClient(Number(id));
    }
  }, [id, fetchClient, fetchProjectsByClient]);

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setEditProjectOpen(true);
  };

  const handleDeleteProject = (project: Project) => {
    setSelectedProject(project);
    setDeleteProjectOpen(true);
  };

  const handleProjectSuccess = () => {
    if (id) {
      fetchProjectsByClient(Number(id));
    }
  };

  if (clientsLoading && !currentClient) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentClient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Cliente no encontrado</p>
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/clients")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/clients")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{currentClient.name}</h1>
            <p className="text-muted-foreground">
              {idTypeLabels[currentClient.identification_type]}:{" "}
              {currentClient.identification}
            </p>
          </div>
        </div>
        {canManageClients && (
          <Button variant="outline" onClick={() => setEditClientOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Editar Cliente
          </Button>
        )}
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentClient.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${currentClient.email}`}
                  className="text-primary hover:underline"
                >
                  {currentClient.email}
                </a>
              </div>
            )}
            {currentClient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${currentClient.phone}`}
                  className="hover:underline"
                >
                  {currentClient.phone}
                </a>
              </div>
            )}
            {currentClient.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{currentClient.address}</span>
              </div>
            )}
          </div>
          {currentClient.notes && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  {currentClient.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Proyectos ({projects.length})
          </CardTitle>
          <Button onClick={() => setCreateProjectOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay proyectos registrados</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setCreateProjectOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear primer proyecto
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>URL Producción</TableHead>
                  <TableHead>Fecha Inicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                    </TableCell>
                    <TableCell>
                      {project.production_url ? (
                        <a
                          href={project.production_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          {project.production_url.replace(/^https?:\/\//, "")}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.start_date
                        ? new Date(project.start_date).toLocaleDateString(
                            "es-EC"
                          )
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[project.status]}>
                        {statusLabels[project.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditProject(project)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteProject(project)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Project Modals */}
      <ProjectCreate
        open={createProjectOpen}
        onOpenChange={setCreateProjectOpen}
        clientId={currentClient.id}
        onSuccess={handleProjectSuccess}
      />

      {selectedProject && (
        <>
          <ProjectEdit
            open={editProjectOpen}
            onOpenChange={setEditProjectOpen}
            project={selectedProject}
            onSuccess={handleProjectSuccess}
          />
          <ProjectDelete
            open={deleteProjectOpen}
            onOpenChange={setDeleteProjectOpen}
            project={selectedProject}
            onSuccess={handleProjectSuccess}
          />
        </>
      )}

      {canManageClients && currentClient && (
        <ClientEdit
          open={editClientOpen}
          onOpenChange={setEditClientOpen}
          client={currentClient as unknown as Client}
          onSuccess={() => {
            if (id) {
              fetchClient(Number(id));
              fetchProjectsByClient(Number(id));
            }
          }}
        />
      )}
    </div>
  );
}
