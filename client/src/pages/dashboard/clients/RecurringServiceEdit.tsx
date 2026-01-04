import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RecurringService } from "../../../stores/clientStore";
import RecurringServiceForm from "./RecurringServiceForm";

interface RecurringServiceEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: RecurringService;
  onSuccess: () => void;
}

export default function RecurringServiceEdit({
  open,
  onOpenChange,
  service,
  onSuccess,
}: RecurringServiceEditProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Servicio Recurrente</DialogTitle>
          <DialogDescription>
            Modifica los datos del servicio recurrente
          </DialogDescription>
        </DialogHeader>
        <RecurringServiceForm
          service={service}
          projectId={service.project_id}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
