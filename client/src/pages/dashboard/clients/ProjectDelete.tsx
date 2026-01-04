import { useClientStore, Project } from "../../../stores/clientStore";
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

interface ProjectDeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onSuccess: () => void;
}

export default function ProjectDelete({
  open,
  onOpenChange,
  project,
  onSuccess,
}: ProjectDeleteProps) {
  const { deleteProject, projectsLoading } = useClientStore();

  const handleDelete = async () => {
    try {
      await deleteProject(project.id);
      toast.success("Proyecto eliminado correctamente");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al eliminar proyecto");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            proyecto <strong>{project.name}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={projectsLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {projectsLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
