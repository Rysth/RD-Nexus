import { useState } from "react";
import toast from "react-hot-toast";
import { RecurringService, useClientStore } from "../../../stores/clientStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RecurringServiceDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: RecurringService;
  onSuccess: () => void;
}

export default function RecurringServiceDelete({
  open,
  onOpenChange,
  service,
  onSuccess,
}: RecurringServiceDeleteProps) {
  const { deleteRecurringService, recurringServicesLoading } = useClientStore();
  const [confirmName, setConfirmName] = useState("");

  const handleDelete = async () => {
    if (confirmName !== service.name) {
      toast.error("El nombre no coincide");
      return;
    }

    try {
      await deleteRecurringService(service.id);
      toast.success("Servicio eliminado correctamente");
      onSuccess();
      onOpenChange(false);
      setConfirmName("");
    } catch (error: any) {
      const message =
        error.response?.data?.error || "Error al eliminar servicio";
      toast.error(message);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminar Servicio Recurrente</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                ¿Estás seguro de que deseas eliminar este servicio recurrente?
                Esta acción no se puede deshacer.
              </p>
              <div className="bg-muted p-3 rounded-md space-y-2">
                <p className="font-medium">{service.name}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline">
                    ${service.amount.toFixed(2)} / {service.billing_cycle_label}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-name">
                  Escribe <span className="font-semibold">{service.name}</span>{" "}
                  para confirmar:
                </Label>
                <Input
                  id="confirm-name"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  placeholder="Nombre del servicio"
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmName("")}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={recurringServicesLoading || confirmName !== service.name}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {recurringServicesLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
