import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useClientStore, Project } from "../../../stores/clientStore";
import { useAuthStore } from "../../../stores/authStore";
import {
  ArrowLeft,
  Building2,
  Globe,
  Calendar,
  ExternalLink,
  Pencil,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProjectEdit from "./ProjectEdit";
import RecurringServiceList from "./RecurringServiceList";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  maintenance: "bg-blue-100 text-blue-800",
  canceled: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  active: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  maintenance: <Clock className="h-4 w-4 text-blue-600" />,
  canceled: <XCircle className="h-4 w-4 text-red-600" />,
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { fetchProject, currentProject, projectsLoading } = useClientStore();

  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const canManageProjects = currentUser?.roles.some((role) =>
    ["admin", "manager"].includes(role)
  );

  useEffect(() => {
    if (id) {
      fetchProject(Number(id));
    }
  }, [id, fetchProject]);

  const handleProjectSuccess = () => {
    if (id) {
      fetchProject(Number(id));
    }
  };

  if (projectsLoading && !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              navigate(`/dashboard/clients/${currentProject.client?.id}`)
            }
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {currentProject.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{currentProject.client?.name}</span>
              <Badge
                className={statusColors[currentProject.status]}
                variant="secondary"
              >
                {currentProject.status_label}
              </Badge>
            </div>
          </div>
        </div>
        {canManageProjects && (
          <Button onClick={() => setEditProjectOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Editar Proyecto
          </Button>
        )}
      </div>

      {/* Project Info */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado</CardTitle>
            {statusIcons[currentProject.status]}
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {currentProject.status_label}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fecha Inicio</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {currentProject.start_date
                ? new Date(currentProject.start_date).toLocaleDateString(
                    "es-EC"
                  )
                : "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              URL Producción
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {currentProject.production_url ? (
              <a
                href={currentProject.production_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                {currentProject.production_url}
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : (
              <span className="text-muted-foreground">No configurada</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      {currentProject.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descripción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {currentProject.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Recurring Services */}
      <RecurringServiceList projectId={currentProject.id} />

      {/* Edit Project Modal */}
      {canManageProjects && currentProject && (
        <ProjectEdit
          open={editProjectOpen}
          onOpenChange={setEditProjectOpen}
          project={currentProject as unknown as Project}
          onSuccess={handleProjectSuccess}
        />
      )}
    </div>
  );
}
