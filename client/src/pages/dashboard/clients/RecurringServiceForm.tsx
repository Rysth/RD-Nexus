import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { RecurringService, useClientStore } from "../../../stores/clientStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RecurringServiceFormValues {
  name: string;
  amount: string;
  billing_cycle: string;
  next_billing_date: string;
  status: string;
  description?: string;
}

interface RecurringServiceFormProps {
  service?: RecurringService | null;
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecurringServiceForm({
  service,
  projectId,
  onClose,
  onSuccess,
}: RecurringServiceFormProps) {
  const isEditing = Boolean(service);
  const {
    createRecurringService,
    updateRecurringService,
    recurringServicesLoading,
  } = useClientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: RecurringServiceFormValues = useMemo(
    () => ({
      name: service?.name || "",
      amount: service?.amount?.toString() || "",
      billing_cycle: service?.billing_cycle || "monthly",
      next_billing_date: service?.next_billing_date || "",
      status: service?.status || "active",
      description: service?.description || "",
    }),
    [service]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringServiceFormValues>({
    defaultValues,
  });

  const billingCycle = watch("billing_cycle");
  const status = watch("status");

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: RecurringServiceFormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && service) {
        await updateRecurringService(service.id, {
          name: data.name,
          amount: parseFloat(data.amount),
          billing_cycle: data.billing_cycle as "monthly" | "yearly",
          next_billing_date: data.next_billing_date,
          status: data.status as "active" | "paused",
          description: data.description || null,
        });
        toast.success("Servicio actualizado correctamente");
      } else {
        await createRecurringService({
          project_id: projectId,
          name: data.name,
          amount: parseFloat(data.amount),
          billing_cycle: data.billing_cycle as "monthly" | "yearly",
          next_billing_date: data.next_billing_date,
          status: data.status as "active" | "paused",
          description: data.description || null,
        });
        toast.success("Servicio creado correctamente");
      }

      onSuccess();
      onClose();
      reset(defaultValues);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.errors?.[0] ||
        `Error al ${isEditing ? "actualizar" : "crear"} servicio`;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre del Servicio *</Label>
        <Input
          id="name"
          placeholder="Ej: Hosting, Mantenimiento Anual"
          {...register("name", {
            required: "El nombre es obligatorio",
            minLength: { value: 2, message: "Mínimo 2 caracteres" },
          })}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto ($) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            {...register("amount", {
              required: "El monto es obligatorio",
              min: { value: 0.01, message: "El monto debe ser mayor a 0" },
            })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="billing_cycle">Ciclo de Facturación *</Label>
          <Select
            value={billingCycle}
            onValueChange={(value) => setValue("billing_cycle", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Mensual</SelectItem>
              <SelectItem value="yearly">Anual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="next_billing_date">Próxima Facturación *</Label>
          <Input
            id="next_billing_date"
            type="date"
            {...register("next_billing_date", {
              required: "La fecha de facturación es obligatoria",
            })}
          />
          {errors.next_billing_date && (
            <p className="text-sm text-destructive">
              {errors.next_billing_date.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Estado *</Label>
          <Select
            value={status}
            onValueChange={(value) => setValue("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          placeholder="Notas adicionales sobre el servicio..."
          rows={3}
          {...register("description")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={recurringServicesLoading || isSubmitting}
        >
          {recurringServicesLoading || isSubmitting
            ? isEditing
              ? "Guardando..."
              : "Creando..."
            : isEditing
            ? "Guardar Cambios"
            : "Crear Servicio"}
        </Button>
      </div>
    </form>
  );
}
