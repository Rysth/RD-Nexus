import { useState, useEffect } from "react";
import { useClientStore, Project } from "../../../stores/clientStore";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";

interface ProjectEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

export default function ProjectEdit({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectEditProps) {
  const { updateProject, projectsLoading } = useClientStore();

  const [formData, setFormData] = useState({
    name: "",
    production_url: "",
    start_date: "",
    status: "active",
    description: "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        production_url: project.production_url || "",
        start_date: project.start_date ? project.start_date.split("T")[0] : "",
        status: project.status,
        description: project.description || "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateProject(project.id, {
        name: formData.name,
        production_url: formData.production_url || null,
        start_date: formData.start_date || null,
        status: formData.status as "active" | "maintenance" | "canceled",
        description: formData.description || null,
      });

      toast.success("Proyecto actualizado correctamente");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || "Error al actualizar proyecto"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
          <DialogDescription>Modifica los datos del proyecto</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Proyecto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="production_url">URL de Producción</Label>
            <Input
              id="production_url"
              type="url"
              value={formData.production_url}
              onChange={(e) =>
                setFormData({ ...formData, production_url: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Fecha de Inicio</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="maintenance">Mantenimiento</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={projectsLoading}>
              {projectsLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
