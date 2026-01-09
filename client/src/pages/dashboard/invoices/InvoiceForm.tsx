import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { useInvoiceStore, InvoiceItem } from "@/stores/invoiceStore";
import { useClientStore, Client, Project } from "@/stores/clientStore";
import api from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Descripción es requerida"),
  quantity: z.coerce.number().min(0.01, "Mínimo 0.01"),
  unit_price: z.coerce.number().min(0, "Precio debe ser >= 0"),
});

const invoiceFormSchema = z.object({
  client_id: z.coerce.number().min(1, "Cliente es requerido"),
  project_id: z.coerce.number().optional().nullable(),
  issue_date: z.string().min(1, "Fecha de emisión es requerida"),
  due_date: z.string().min(1, "Fecha de vencimiento es requerida"),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(15),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Agrega al menos un elemento"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export default function InvoiceForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    currentInvoice,
    invoicesLoading,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    clearCurrentInvoice,
  } = useInvoiceStore();

  const { clients, fetchClients, fetchProjectsByClient } = useClientStore();

  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [missingClient, setMissingClient] = useState<Client | null>(null);

  const form = useForm<InvoiceFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(invoiceFormSchema) as any,
    defaultValues: {
      client_id: 0,
      project_id: null,
      issue_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(addDays(new Date(), 15), "yyyy-MM-dd"),
      tax_rate: 15,
      notes: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Load clients
  useEffect(() => {
    fetchClients(1, 100);
  }, [fetchClients]);

  // If editing and the invoice's client isn't in the current clients page,
  // fetch it so the Select can render the selected label.
  useEffect(() => {
    if (!isEdit || !currentInvoice || clients.length === 0) return;

    const clientIdRaw = currentInvoice.client_id;
    if (clientIdRaw === null || clientIdRaw === undefined) return;

    const clientId = Number(clientIdRaw);
    if (!Number.isFinite(clientId) || clientId <= 0) return;

    const exists = clients.some((c) => Number(c.id) === clientId);
    if (exists) {
      if (missingClient?.id === clientId) setMissingClient(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const response = await api.get(`/api/v1/clients/${clientId}`);
        if (!cancelled) {
          setMissingClient(response.data as Client);
          setFormKey((k) => k + 1);
        }
      } catch {
        // ignore: we can still render the form without the label
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEdit, currentInvoice, clients, missingClient?.id]);

  // Load invoice if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchInvoice(parseInt(id));
    }
    return () => clearCurrentInvoice();
  }, [isEdit, id, fetchInvoice, clearCurrentInvoice]);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && currentInvoice && clients.length > 0) {
      const safeClientId =
        currentInvoice.client_id !== undefined &&
        currentInvoice.client_id !== null
          ? Number(currentInvoice.client_id)
          : undefined;
      const safeProjectId =
        currentInvoice.project_id !== undefined &&
        currentInvoice.project_id !== null
          ? Number(currentInvoice.project_id)
          : null;

      form.reset({
        client_id: safeClientId ?? 0,
        project_id: null,
        issue_date: currentInvoice.issue_date,
        due_date: currentInvoice.due_date,
        tax_rate: (() => {
          const raw = currentInvoice.tax_rate;
          if (raw === null || raw === undefined) return 15;
          const num = Number(raw);
          return Number.isFinite(num) ? num : 15;
        })(),
        notes: currentInvoice.notes || "",
        items:
          currentInvoice.items?.map((item: InvoiceItem) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          })) || [],
      });

      if (safeClientId) {
        void (async () => {
          const projects = await loadProjectsForClient(safeClientId);
          if (
            safeProjectId &&
            projects.some((p) => Number(p.id) === safeProjectId)
          ) {
            form.setValue("project_id", safeProjectId);
          }
          setFormKey((k) => k + 1);
        })();
      } else {
        setFormKey((k) => k + 1);
      }
    }
  }, [isEdit, currentInvoice, clients.length, form]);

  const loadProjectsForClient = async (
    clientId: number
  ): Promise<Project[]> => {
    setLoadingProjects(true);
    try {
      const projects = await fetchProjectsByClient(clientId);
      setClientProjects(projects || []);
      return projects || [];
    } catch (error) {
      console.error("Error loading projects:", error);
      setClientProjects([]);
      return [];
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleClientChange = async (clientId: string) => {
    const numClientId = Number.parseInt(clientId, 10);
    form.setValue("client_id", numClientId);
    form.setValue("project_id", null);
    setMissingClient(null);

    if (numClientId > 0) {
      await loadProjectsForClient(numClientId);
    } else {
      setClientProjects([]);
    }
  };

  // Calculate totals
  const watchedItems = form.watch("items");
  const watchedTaxRate = form.watch("tax_rate") || 0;

  const calculateItemSubtotal = (item: (typeof watchedItems)[number]) => {
    return item.quantity * item.unit_price;
  };

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + calculateItemSubtotal(item),
    0
  );
  const taxAmount = subtotal * (watchedTaxRate / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const onSubmit = async (data: InvoiceFormValues) => {
    try {
      const payload = {
        ...data,
        project_id: data.project_id || undefined,
      };

      if (isEdit && id) {
        await updateInvoice(parseInt(id), payload);
        navigate(`/dashboard/invoices/${id}`);
      } else {
        const newInvoice = await createInvoice(payload);
        navigate(`/dashboard/invoices/${newInvoice.id}`);
      }
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Error al guardar";
      toast.error(message);
    }
  };

  const addItem = () => {
    append({
      description: "",
      quantity: 1,
      unit_price: 0,
    });
  };

  if (isEdit && invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {isEdit ? "Editar Comprobante" : "Nuevo Comprobante de Servicio"}
          </h2>
          <p className="text-muted-foreground">
            {isEdit
              ? "Modifica los datos del comprobante"
              : "Crea un nuevo comprobante de servicio"}
          </p>
        </div>
      </div>

      <Form {...form} key={formKey}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Client */}
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente *</FormLabel>
                      <Select
                        key={`client-select-${formKey}-${field.value}`}
                        value={
                          !field.value || field.value === 0
                            ? ""
                            : String(field.value)
                        }
                        onValueChange={(value: string) => {
                          void handleClientChange(value);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(missingClient
                            ? [
                                missingClient,
                                ...clients.filter(
                                  (c) => Number(c.id) !== missingClient.id
                                ),
                              ]
                            : clients
                          ).map((client) => (
                            <SelectItem
                              key={client.id}
                              value={String(client.id)}
                            >
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Project */}
                <FormField
                  control={form.control}
                  name="project_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proyecto (opcional)</FormLabel>
                      <Select
                        key={`project-select-${formKey}-${field.value}`}
                        value={field.value ? String(field.value) : "none"}
                        onValueChange={(value) =>
                          field.onChange(
                            value === "none" ? null : Number(value)
                          )
                        }
                        disabled={
                          loadingProjects || clientProjects.length === 0
                        }
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                loadingProjects
                                  ? "Cargando..."
                                  : "Selecciona un proyecto"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Sin proyecto</SelectItem>
                          {clientProjects.map((project) => (
                            <SelectItem
                              key={project.id}
                              value={String(project.id)}
                            >
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* Issue Date */}
                <FormField
                  control={form.control}
                  name="issue_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Emisión *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Due Date */}
                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Vencimiento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tax Rate */}
                <FormField
                  control={form.control}
                  name="tax_rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IVA (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notas adicionales..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Elementos del Comprobante</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addItem}
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-4 p-4 border rounded-lg md:grid-cols-12"
                  >
                    {/* Description */}
                    <div className="md:col-span-6">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index > 0 ? "sr-only" : ""}>
                              Descripción
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Descripción del servicio..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index > 0 ? "sr-only" : ""}>
                              Cantidad
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0.01"
                                step="0.01"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.unit_price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={index > 0 ? "sr-only" : ""}>
                              Precio
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Subtotal & Remove */}
                    <div className="flex items-end gap-2 md:col-span-2">
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            index === 0 ? "" : "md:hidden"
                          }`}
                        >
                          {index === 0 && (
                            <span className="block mb-2">Subtotal</span>
                          )}
                        </p>
                        <p className="py-2 font-semibold">
                          {formatCurrency(
                            calculateItemSubtotal(watchedItems[index])
                          )}
                        </p>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="flex justify-end mt-6">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      IVA ({watchedTaxRate}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={invoicesLoading}>
              {invoicesLoading && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {isEdit ? "Guardar Cambios" : "Crear Comprobante"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
