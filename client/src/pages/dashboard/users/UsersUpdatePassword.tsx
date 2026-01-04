import { useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import PasswordInput from "../../../components/shared/PasswordInput";
import { User, useUserStore } from "../../../stores/userStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface UsersUpdatePasswordProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

interface UpdatePasswordForm {
  password: string;
  password_confirmation: string;
}

export default function UsersUpdatePassword({
  isOpen,
  onClose,
  user,
}: UsersUpdatePasswordProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<UpdatePasswordForm>({
    defaultValues: {
      password: "",
      password_confirmation: "",
    },
  });

  const onSubmit = async (data: UpdatePasswordForm) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update user password endpoint using the store method
      await useUserStore
        .getState()
        .updateUserPassword(user.id, data.password, data.password_confirmation);

      toast.success(`Contraseña de ${user.fullname} actualizada correctamente`);
      reset();
      onClose();
    } catch (error: any) {
      let errorMessage = "Error al actualizar la contraseña";

      if (error.response?.status === 422) {
        errorMessage =
          "Las contraseñas no coinciden o no cumplen los requisitos";
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Actualizar Contraseña</DialogTitle>
          <DialogDescription>
            Se actualizará la contraseña para {user.fullname} ({user.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start space-x-2">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div>
                <h4 className="font-semibold text-blue-900">Información</h4>
                <p className="text-sm text-blue-700">
                  La nueva contraseña será aplicada inmediatamente y el usuario
                  deberá usarla en su próximo inicio de sesión.
                </p>
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <PasswordInput
              register={register("password", {
                required: "La contraseña es requerida",
                minLength: {
                  value: 8,
                  message: "Mínimo 8 caracteres",
                },
              })}
              placeholder="••••••••••••"
              name="password"
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Password Confirmation */}
          <div className="space-y-2">
            <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
            <PasswordInput
              register={register("password_confirmation", {
                required: "La confirmación de contraseña es requerida",
                validate: (value) =>
                  value === watch("password") || "Las contraseñas no coinciden",
              })}
              placeholder="••••••••••••"
              name="password_confirmation"
              autoComplete="new-password"
            />
            {errors.password_confirmation && (
              <p className="text-sm text-destructive">
                {errors.password_confirmation.message}
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              )}
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
