import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Client } from "../../../stores/clientStore";
import ClientsForm from "./ClientsForm";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>Modifica los datos del cliente</DialogDescription>
        </DialogHeader>

        <ClientsForm
          client={client}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
