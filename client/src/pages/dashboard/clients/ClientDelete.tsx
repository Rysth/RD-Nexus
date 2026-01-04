import { useClientStore, Client } from "../../../stores/clientStore";
import { toast } from "react-hot-toast";
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

  const handleDelete = async () => {
    try {
      await deleteClient(client.id);
      toast.success("Cliente eliminado correctamente");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar cliente");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            cliente <strong>{client.name}</strong> y todos sus proyectos
            asociados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={clientsLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {clientsLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
