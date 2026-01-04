import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User } from "../../../stores/userStore";
import UsersForm from "./UsersForm";

interface UsersEditProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function UsersEdit({ isOpen, onClose, user }: UsersEditProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuario</DialogTitle>
        </DialogHeader>
        <UsersForm user={user} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
