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

interface ClientCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function ClientCreate({
  open,
  onOpenChange,
  onSuccess,
}: ClientCreateProps) {
  const { createClient, clientsLoading } = useClientStore();

  const [formData, setFormData] = useState({
    name: "",
    identification_type: "05",
    identification: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createClient({
        name: formData.name,
        identification_type: formData.identification_type,
        identification: formData.identification,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        notes: formData.notes || undefined,
      });

      toast.success("Cliente creado correctamente");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al crear cliente");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      identification_type: "05",
      identification: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
          <DialogDescription>
            Ingresa los datos del nuevo cliente
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre / Razón Social *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Empresa ABC S.A."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="identification_type">Tipo de ID *</Label>
              <Select
                value={formData.identification_type}
                onValueChange={(value) =>
                  setFormData({ ...formData, identification_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="04">RUC</SelectItem>
                  <SelectItem value="05">Cédula</SelectItem>
                  <SelectItem value="06">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identification">Identificación *</Label>
              <Input
                id="identification"
                value={formData.identification}
                onChange={(e) =>
                  setFormData({ ...formData, identification: e.target.value })
                }
                placeholder={
                  formData.identification_type === "04"
                    ? "1234567890001"
                    : "1234567890"
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="contacto@empresa.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+593 99 123 4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Dirección</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Av. Principal 123, Quito"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Notas adicionales sobre el cliente..."
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
            <Button type="submit" disabled={clientsLoading}>
              {clientsLoading ? "Creando..." : "Crear Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
