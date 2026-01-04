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
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  active: "bg-green-100 text-green-800 hover:bg-green-100",
  maintenance: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  canceled: "bg-red-100 text-red-800 hover:bg-red-100",
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

  // Stats calculation
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const maintenanceProjects = projects.filter(
    (p) => p.status === "maintenance"
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard/clients")}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {currentClient.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="rounded-sm font-normal">
                {idTypeLabels[currentClient.identification_type]}
              </Badge>
              <span>{currentClient.identification}</span>
            </div>
          </div>
        </div>
        {canManageClients && (
          <Button onClick={() => setEditClientOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Editar Cliente
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Proyectos
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Proyectos registrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProjects}</div>
            <p className="text-xs text-muted-foreground">En producción</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mantenimiento</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceProjects}</div>
            <p className="text-xs text-muted-foreground">Soporte activo</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Left Column: Client Info (2 cols) */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Email
                    </p>
                    {currentClient.email ? (
                      <a
                        href={`mailto:${currentClient.email}`}
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {currentClient.email}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Teléfono
                    </p>
                    {currentClient.phone ? (
                      <a
                        href={`tel:${currentClient.phone}`}
                        className="text-sm hover:underline"
                      >
                        {currentClient.phone}
                      </a>
                    ) : (
                      <p className="text-sm text-muted-foreground">—</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Dirección
                    </p>
                    <p className="text-sm">
                      {currentClient.address || (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {currentClient.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {currentClient.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Projects (5 cols) */}
        <div className="md:col-span-5">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Proyectos</CardTitle>
                <CardDescription>
                  Lista de proyectos asociados a este cliente
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setCreateProjectOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </CardHeader>
            <CardContent className="flex-1">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
                  <Globe className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No hay proyectos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Este cliente aún no tiene proyectos registrados.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCreateProjectOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear primer proyecto
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border">
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
                                className="flex items-center gap-1 text-primary hover:underline max-w-[200px] truncate"
                              >
                                {project.production_url}
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
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
                            <Badge
                              className={statusColors[project.status]}
                              variant="secondary"
                            >
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
