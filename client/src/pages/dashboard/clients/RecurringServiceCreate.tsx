import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RecurringServiceForm from "./RecurringServiceForm";

interface RecurringServiceCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  onSuccess: () => void;
}

export default function RecurringServiceCreate({
  open,
  onOpenChange,
  projectId,
  onSuccess,
}: RecurringServiceCreateProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nuevo Servicio Recurrente</DialogTitle>
          <DialogDescription>
            Agrega un servicio de cobro recurrente al proyecto
          </DialogDescription>
        </DialogHeader>
        <RecurringServiceForm
          projectId={projectId}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
