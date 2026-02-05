import { useEffect, useState, useCallback } from "react";
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
  FormDescription,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calculator,
} from "lucide-react";
import toast from "react-hot-toast";

const invoiceItemSchema = z.object({
  description: z.string().min(1, "Descripción es requerida"),
  quantity: z.coerce.number().min(0.01, "Mínimo 0.01"),
  unit_price: z.coerce.number().min(0, "Precio debe ser >= 0"),
  discount_percent: z.coerce.number().min(0).max(100).optional().default(0),
  payment_type: z
    .enum(["unico", "anual", "mensual"])
    .optional()
    .default("unico"),
  notes: z.string().optional(),
});

const invoiceFormSchema = z.object({
  client_id: z.coerce.number().min(1, "Cliente es requerido"),
  project_id: z.coerce.number().optional().nullable(),
  issue_date: z.string().min(1, "Fecha de emisión es requerida"),
  due_date: z.string().min(1, "Fecha de vencimiento es requerida"),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(15),
  notes: z.string().optional(),
  terms_conditions: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "Agrega al menos un elemento"),
});

type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

const DEFAULT_TERMS_CONDITIONS = `TÉRMINOS Y CONDICIONES:

1. FORMA DE PAGO: El pago debe realizarse dentro del plazo indicado en este documento.

2. MÉTODOS DE PAGO ACEPTADOS:
   • Transferencia bancaria a la cuenta indicada
   • Efectivo
   • Tarjeta de crédito/débito

3. MORA E INTERESES: Facturas vencidas pueden generar cargos por mora según lo establecido por la ley.

4. SOPORTE TÉCNICO: Para consultas relacionadas con esta factura, contacte a nuestro equipo de soporte.

5. GARANTÍA: Los servicios prestados están sujetos a las garantías acordadas en el contrato de servicio.`;

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
      terms_conditions: DEFAULT_TERMS_CONDITIONS,
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          discount_percent: 0,
          payment_type: "unico",
          notes: "",
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

  // Helper function to load projects for a client
  const loadProjectsForClient = useCallback(
    async (clientId: number): Promise<Project[]> => {
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
    },
    [fetchProjectsByClient],
  );

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
        terms_conditions:
          currentInvoice.terms_conditions || DEFAULT_TERMS_CONDITIONS,
        items:
          currentInvoice.items?.map((item: InvoiceItem) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount_percent: Number(item.discount_percent) || 0,
            payment_type: item.payment_type || "unico",
            notes: item.notes || "",
          })) || [],
      });

      if (safeClientId) {
        void (async () => {
          const projects = await loadProjectsForClient(safeClientId);
          if (
            safeProjectId &&
            projects.some((p) => Number(p.id) === safeProjectId)
          ) {
            form.setValue("project_id", safeProjectId, { shouldDirty: false });
          }
          setFormKey((k) => k + 1);
        })();
      } else {
        setFormKey((k) => k + 1);
      }
    }
  }, [isEdit, currentInvoice, clients.length, form, loadProjectsForClient]);

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
    const gross = item.quantity * item.unit_price;
    const discountAmount = gross * ((item.discount_percent || 0) / 100);
    return gross - discountAmount;
  };

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + calculateItemSubtotal(item),
    0,
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
      discount_percent: 0,
      payment_type: "unico",
      notes: "",
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
              ? `Editando ${currentInvoice?.invoice_number}`
              : "Crea un nuevo comprobante de servicio para un cliente"}
          </p>
        </div>
      </div>

      <Form {...form} key={formKey}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Main Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Información General</CardTitle>
                  <CardDescription>
                    Datos básicos del comprobante
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
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
                                      (c) => Number(c.id) !== missingClient.id,
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
                            value={
                              field.value === null || field.value === undefined
                                ? "none"
                                : String(field.value)
                            }
                            onValueChange={(v) =>
                              field.onChange(v === "none" ? null : parseInt(v))
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
                          <FormDescription>
                            {loadingProjects
                              ? "Cargando proyectos..."
                              : clientProjects.length === 0
                                ? "Selecciona un cliente primero"
                                : ""}
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Elementos</CardTitle>
                      <CardDescription>
                        Productos o servicios a facturar
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg space-y-4"
                      >
                        {/* Row 1: Description, Quantity, Price, Discount, Payment Type, Total */}
                        <div className="grid gap-4 md:grid-cols-12 items-end">
                          {/* Description */}
                          <div className="md:col-span-3">
                            <FormField
                              control={form.control}
                              name={`items.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel
                                    className={index > 0 ? "sr-only" : ""}
                                  >
                                    Descripción
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Descripción del servicio"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Quantity */}
                          <div className="md:col-span-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel
                                    className={index > 0 ? "sr-only" : ""}
                                  >
                                    Cant.
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0.01"
                                      {...field}
                                    />
                                  </FormControl>
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
                                  <FormLabel
                                    className={index > 0 ? "sr-only" : ""}
                                  >
                                    P. Unitario
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Discount Percent */}
                          <div className="md:col-span-1">
                            <FormField
                              control={form.control}
                              name={`items.${index}.discount_percent`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel
                                    className={index > 0 ? "sr-only" : ""}
                                  >
                                    Desc. %
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max="100"
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Payment Type */}
                          <div className="md:col-span-2">
                            <FormField
                              control={form.control}
                              name={`items.${index}.payment_type`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel
                                    className={index > 0 ? "sr-only" : ""}
                                  >
                                    Tipo Pago
                                  </FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    value={field.value || "unico"}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Tipo" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="unico">
                                        Único
                                      </SelectItem>
                                      <SelectItem value="mensual">
                                        Mensual
                                      </SelectItem>
                                      <SelectItem value="anual">
                                        Anual
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Subtotal */}
                          <div className="md:col-span-2 text-right">
                            <p
                              className={`text-sm font-medium ${
                                index === 0 ? "" : "md:hidden"
                              }`}
                            >
                              {index === 0 && (
                                <span className="block mb-2">Total</span>
                              )}
                            </p>
                            <p className="py-2 font-semibold">
                              {formatCurrency(
                                calculateItemSubtotal(watchedItems[index]),
                              )}
                            </p>
                          </div>

                          {/* Remove Button */}
                          <div className="md:col-span-1 flex justify-end">
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

                        {/* Row 2: Notes */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Textarea
                                  placeholder="Notas adicionales del item (opcional)..."
                                  className="resize-none min-h-[60px]"
                                  {...field}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Totals Summary */}
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

                  {form.formState.errors.items && (
                    <p className="mt-2 text-sm text-red-500">
                      {form.formState.errors.items.message}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Notes & Terms */}
              <Card>
                <CardHeader>
                  <CardTitle>Notas y Condiciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="terms_conditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Términos y Condiciones</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Términos y condiciones del comprobante"
                            className="min-h-[150px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notas Internas</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Notas internas (no visibles para el cliente)"
                            className="min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Estas notas son solo para uso interno
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Settings */}
            <div className="space-y-6">
              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Fechas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                </CardContent>
              </Card>

              {/* Totals */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Cálculos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="tax_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IVA (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 space-y-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        IVA ({watchedTaxRate}%):
                      </span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-lg font-bold border-t">
                      <span>Total:</span>
                      <span className="text-primary">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={form.formState.isSubmitting}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isEdit ? "Guardar Cambios" : "Crear Comprobante"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(-1)}
                  >
                    Cancelar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
