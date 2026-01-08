import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Client, useClientStore } from "../../../stores/clientStore";
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

interface ClientFormValues {
  name: string;
  identification_type: string;
  identification?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

interface ClientsFormProps {
  client?: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ClientsForm({
  client,
  onClose,
  onSuccess,
}: ClientsFormProps) {
  const isEditing = Boolean(client);
  const { createClient, updateClient, clientsLoading } = useClientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: ClientFormValues = useMemo(
    () => ({
      name: client?.name || "",
      identification_type: client?.identification_type || "05",
      identification: client?.identification || "",
      email: client?.email || "",
      phone: client?.phone || "",
      address: client?.address || "",
      notes: client?.notes || "",
    }),
    [client]
  );

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ClientFormValues>({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data: ClientFormValues) => {
    setIsSubmitting(true);
    try {
      const identification = data.identification?.trim() || "";
      if (isEditing && client) {
        await updateClient(client.id, {
          name: data.name,
          identification_type: data.identification_type,
          identification: identification ? identification : null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          notes: data.notes || null,
        });
        toast.success("Cliente actualizado correctamente");
      } else {
        await createClient({
          name: data.name,
          identification_type: data.identification_type,
          ...(identification ? { identification } : {}),
          email: data.email || undefined,
          phone: data.phone || undefined,
          address: data.address || undefined,
          notes: data.notes || undefined,
        });
        toast.success("Cliente creado correctamente");
      }

      onSuccess();
      onClose();
      reset(defaultValues);
    } catch (error: any) {
      const message =
        error.response?.data?.error ||
        error.response?.data?.errors?.[0] ||
        `Error al ${isEditing ? "actualizar" : "crear"} cliente`;
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre / Razón Social *</Label>
        <Input
          id="name"
          placeholder="Empresa ABC S.A."
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
          <Label htmlFor="identification_type">Tipo de ID *</Label>
          <Select
            defaultValue={defaultValues.identification_type}
            onValueChange={(value) => setValue("identification_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="04">RUC</SelectItem>
              <SelectItem value="05">Cédula</SelectItem>
              <SelectItem value="06">Pasaporte</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="identification">Identificación</Label>
          <Input
            id="identification"
            placeholder="1234567890"
            {...register("identification", {
              validate: (value) => {
                const trimmed = value?.trim() || "";
                if (!trimmed) return true;
                return trimmed.length >= 5 || "Mínimo 5 caracteres";
              },
            })}
          />
          {errors.identification && (
            <p className="text-sm text-destructive">
              {errors.identification.message}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="contacto@empresa.com"
            {...register("email", {
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Correo electrónico inválido",
              },
            })}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            placeholder="+593991234567"
            {...register("phone")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Dirección</Label>
        <Input
          id="address"
          placeholder="Av. Principal 123, Quito"
          {...register("address")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notas</Label>
        <Textarea
          id="notes"
          placeholder="Notas adicionales sobre el cliente..."
          rows={3}
          {...register("notes")}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" disabled={clientsLoading || isSubmitting}>
          {clientsLoading || isSubmitting
            ? isEditing
              ? "Guardando..."
              : "Creando..."
            : isEditing
            ? "Guardar Cambios"
            : "Crear Cliente"}
        </Button>
      </div>
    </form>
  );
}
