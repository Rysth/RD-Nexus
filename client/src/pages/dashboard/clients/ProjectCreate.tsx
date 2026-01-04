import { useState } from "react";
import { useClientStore } from "../../../stores/clientStore";
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

interface ProjectCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number;
  onSuccess: () => void;
}

export default function ProjectCreate({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: ProjectCreateProps) {
  const { createProject, projectsLoading } = useClientStore();

  const [formData, setFormData] = useState({
    name: "",
    production_url: "",
    start_date: "",
    status: "active",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createProject({
        client_id: clientId,
        name: formData.name,
        production_url: formData.production_url || undefined,
        start_date: formData.start_date || undefined,
        status: formData.status as "active" | "maintenance" | "canceled",
        description: formData.description || undefined,
      });

      toast.success("Proyecto creado correctamente");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear proyecto");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      production_url: "",
      start_date: "",
      status: "active",
      description: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo proyecto
          </DialogDescription>
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
              placeholder="Sitio Web Corporativo"
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
              placeholder="https://www.ejemplo.com"
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
              placeholder="Descripción del proyecto..."
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
              {projectsLoading ? "Creando..." : "Crear Proyecto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
