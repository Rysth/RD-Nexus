import { useState, useEffect } from "react";
import { useClientStore, Client } from "../../../stores/clientStore";
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

interface ClientEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess: () => void;
}

export default function ClientEdit({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientEditProps) {
  const { updateClient, clientsLoading } = useClientStore();

  const [formData, setFormData] = useState({
    name: "",
    identification_type: "05",
    identification: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name,
        identification_type: client.identification_type,
        identification: client.identification,
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        notes: client.notes || "",
      });
    }
  }, [client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateClient(client.id, {
        name: formData.name,
        identification_type: formData.identification_type,
        identification: formData.identification,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
        notes: formData.notes || null,
      });

      toast.success("Cliente actualizado correctamente");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al actualizar cliente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Modifica los datos del cliente</DialogDescription>
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
              {clientsLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
