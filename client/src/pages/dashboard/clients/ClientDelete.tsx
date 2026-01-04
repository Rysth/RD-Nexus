import { useState } from "react";
import { toast } from "react-hot-toast";
import { useClientStore, Client } from "../../../stores/clientStore";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../components/ui/alert-dialog";

interface ClientDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onSuccess: () => void;
}

export default function ClientDelete({
  open,
  onOpenChange,
  client,
  onSuccess,
}: ClientDeleteProps) {
  const { deleteClient, clientsLoading } = useClientStore();
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    try {
      await deleteClient(client.id);
      toast.success(`Cliente ${client.name} eliminado correctamente`);
      setConfirmText("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar cliente");
    }
  };

  const handleClose = () => {
    setConfirmText("");
    onOpenChange(false);
  };

  const isConfirmValid = confirmText === client.name;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Eliminar Cliente
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
                <div className="flex items-start space-x-2">
                  <div className="text-destructive mt-0.5">!</div>
                  <div>
                    <h4 className="font-semibold text-destructive">
                      Advertencia
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Esta acción no se puede deshacer. Se eliminarán el cliente
                      y sus proyectos asociados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-md">
                <p className="font-medium mb-2">Cliente a eliminar:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-semibold">Nombre:</span> {client.name}
                  </div>
                  <div>
                    <span className="font-semibold">Identificación:</span>{" "}
                    {client.identification}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Tipo:</span>
                    <Badge variant="outline">
                      {client.identification_type}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-semibold">Email:</span>{" "}
                    {client.email || "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-name">
                  Para confirmar, escribe el nombre del cliente:
                  <span className="ml-1 font-semibold">{client.name}</span>
                </Label>
                <Input
                  id="confirm-name"
                  type="text"
                  placeholder={client.name}
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  disabled={clientsLoading}
                />
                {!isConfirmValid && confirmText.length > 0 && (
                  <p className="text-xs text-destructive">
                    El nombre no coincide con "{client.name}"
                  </p>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={!isConfirmValid || clientsLoading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {clientsLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
