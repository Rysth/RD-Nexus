import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UsersForm from "./UsersForm";

interface UsersCreateProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UsersCreate({ isOpen, onClose }: UsersCreateProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <UsersForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
