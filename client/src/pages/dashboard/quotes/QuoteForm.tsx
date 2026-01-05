import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuoteStore, QuoteItem } from "@/stores/quoteStore";
import { useClientStore, Project } from "@/stores/clientStore";
import { format, addDays } from "date-fns";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
  Calculator,
} from "lucide-react";

const quoteItemSchema = z.object({
  description: z.string().min(1, "Descripción es requerida"),
  quantity: z.coerce.number().min(0.01, "Mínimo 0.01"),
  unit_price: z.coerce.number().min(0, "Precio debe ser >= 0"),
  discount_percent: z.coerce.number().min(0).max(100).optional().default(0),
  notes: z.string().optional(),
});

const quoteFormSchema = z.object({
  client_id: z.coerce.number().min(1, "Cliente es requerido"),
  project_id: z.coerce.number().optional().nullable(),
  title: z.string().min(1, "Título es requerido").max(255),
  description: z.string().optional(),
  issue_date: z.string().min(1, "Fecha de emisión es requerida"),
  valid_until: z.string().min(1, "Fecha de validez es requerida"),
  discount_percent: z.coerce.number().min(0).max(100).optional().default(0),
  tax_rate: z.coerce.number().min(0).max(100).optional().default(15),
  terms_conditions: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, "Agrega al menos un elemento"),
});

type QuoteFormValues = z.infer<typeof quoteFormSchema>;

export default function QuoteForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const {
    currentQuote,
    quotesLoading,
    fetchQuote,
    createQuote,
    updateQuote,
    clearCurrentQuote,
  } = useQuoteStore();

  const { clients, fetchClients, fetchProjectsByClient } = useClientStore();

  // Estado local para proyectos del cliente seleccionado
  const [clientProjects, setClientProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  // Track if form has been initialized with quote data
  const [formKey, setFormKey] = useState(0);

  const form = useForm<QuoteFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(quoteFormSchema) as any,
    defaultValues: {
      client_id: 0,
      project_id: null,
      title: "",
      description: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      valid_until: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      discount_percent: 0,
      tax_rate: 15,
      terms_conditions: "",
      notes: "",
      items: [
        {
          description: "",
          quantity: 1,
          unit_price: 0,
          discount_percent: 0,
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

  // Load quote if editing
  useEffect(() => {
    if (isEdit && id) {
      fetchQuote(parseInt(id));
    }
    return () => clearCurrentQuote();
  }, [isEdit, id, fetchQuote, clearCurrentQuote]);

  // Populate form when editing
  useEffect(() => {
    // Wait for clients to load so the Select can resolve the label
    if (isEdit && currentQuote && clients.length > 0) {
      const safeClientId =
        currentQuote.client_id !== undefined && currentQuote.client_id !== null
          ? Number(currentQuote.client_id)
          : undefined;
      const safeProjectId =
        currentQuote.project_id !== undefined &&
        currentQuote.project_id !== null
          ? Number(currentQuote.project_id)
          : null;

      // Debug: verify clients array has the expected client
      console.log("[QuoteForm] Populating form:", {
        safeClientId,
        safeProjectId,
        clientsCount: clients.length,
        clientExists: clients.some((c) => c.id === safeClientId),
      });

      form.reset({
        client_id: safeClientId ?? 0,
        // Set after projects load so the Select can resolve the label
        project_id: null,
        title: currentQuote.title,
        description: currentQuote.description || "",
        issue_date: currentQuote.issue_date,
        valid_until: currentQuote.valid_until,
        discount_percent: Number(currentQuote.discount_percent) || 0,
        tax_rate:
          Number(
            (currentQuote as { tax_rate?: number }).tax_rate ??
              currentQuote.tax_percent
          ) || 15,
        terms_conditions: currentQuote.terms_conditions || "",
        notes: currentQuote.notes || "",
        items:
          currentQuote.items?.map((item: QuoteItem) => ({
            description: item.description,
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
            discount_percent: Number(item.discount_percent) || 0,
            notes: item.notes || "",
          })) || [],
      });

      // Cargar proyectos del cliente y forzar re-render del form
      if (safeClientId) {
        void (async () => {
          const projects = await loadProjectsForClient(safeClientId);
          if (
            safeProjectId &&
            projects.some((p) => Number(p.id) === safeProjectId)
          ) {
            form.setValue("project_id", safeProjectId, { shouldDirty: false });
          }
          // Force form re-render after all values are set
          setFormKey((k) => k + 1);
        })();
      } else {
        // No projects to load, just force re-render
        setFormKey((k) => k + 1);
      }
    }
  }, [isEdit, currentQuote, clients.length, form]);

  // Función para cargar proyectos de un cliente
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

  // Handle client change
  const handleClientChange = async (clientId: string) => {
    const numClientId = Number.parseInt(clientId, 10);
    form.setValue("client_id", numClientId);
    form.setValue("project_id", null);

    if (numClientId > 0) {
      await loadProjectsForClient(numClientId);
    } else {
      setClientProjects([]);
    }
  };

  // Calculate totals
  const watchedItems = form.watch("items");
  const watchedDiscountPercent = form.watch("discount_percent") || 0;
  const watchedTaxRate = form.watch("tax_rate") || 0;

  const calculateItemSubtotal = (item: (typeof watchedItems)[number]) => {
    const gross = item.quantity * item.unit_price;
    const discountAmount = gross * ((item.discount_percent || 0) / 100);
    return gross - discountAmount;
  };

  const subtotal = watchedItems.reduce(
    (sum, item) => sum + calculateItemSubtotal(item),
    0
  );
  const discountAmount = subtotal * (watchedDiscountPercent / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (watchedTaxRate / 100);
  const total = taxableAmount + taxAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const onSubmit = async (data: QuoteFormValues) => {
    try {
      const payload = {
        ...data,
        project_id: data.project_id || undefined,
      };

      if (isEdit && id) {
        await updateQuote(parseInt(id), payload);
        navigate(`/dashboard/quotes/${id}`);
      } else {
        const newQuote = await createQuote(payload);
        navigate(`/dashboard/quotes/${newQuote.id}`);
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
      notes: "",
    });
  };

  if (isEdit && quotesLoading) {
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
            {isEdit ? "Editar Cotización" : "Nueva Cotización"}
          </h2>
          <p className="text-muted-foreground">
            {isEdit
              ? `Editando ${currentQuote?.quote_number}`
              : "Crea una nueva cotización para un cliente"}
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
                    Datos básicos de la cotización
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Desarrollo de sitio web"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
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
                            onValueChange={handleClientChange}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((client) => (
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
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder={
                                    loadingProjects
                                      ? "Cargando proyectos..."
                                      : clientProjects.length === 0
                                      ? "Sin proyectos"
                                      : "Seleccionar proyecto"
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
                            {loadingProjects && "Cargando proyectos..."}
                            {!loadingProjects &&
                              form.watch("client_id") > 0 &&
                              clientProjects.length === 0 &&
                              "El cliente no tiene proyectos"}
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descripción del trabajo a cotizar"
                            className="min-h-[100px]"
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
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Elementos</CardTitle>
                      <CardDescription>
                        Productos o servicios a cotizar
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addItem} size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">
                            Descripción
                          </TableHead>
                          <TableHead className="w-20">Cantidad</TableHead>
                          <TableHead className="w-28">P. Unitario</TableHead>
                          <TableHead className="w-20">Desc. %</TableHead>
                          <TableHead className="text-right w-28">
                            Subtotal
                          </TableHead>
                          <TableHead className="w-12" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fields.map((field, index) => {
                          const itemSubtotal = calculateItemSubtotal(
                            watchedItems[index] || {
                              quantity: 0,
                              unit_price: 0,
                              discount_percent: 0,
                            }
                          );
                          return (
                            <TableRow key={field.id}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          placeholder="Descripción del item"
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0.01"
                                          className="w-20"
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.unit_price`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          className="w-28"
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.discount_percent`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input
                                          type="number"
                                          step="0.01"
                                          min="0"
                                          max="100"
                                          className="w-20"
                                          {...field}
                                        />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell className="font-medium text-right">
                                {formatCurrency(itemSubtotal)}
                              </TableCell>
                              <TableCell>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => remove(index)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={4} className="text-right">
                            Subtotal
                          </TableCell>
                          <TableCell className="font-medium text-right">
                            {formatCurrency(subtotal)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        {watchedDiscountPercent > 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-right">
                              Descuento ({watchedDiscountPercent}%)
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              -{formatCurrency(discountAmount)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell colSpan={4} className="text-right">
                            IVA ({watchedTaxRate}%)
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(taxAmount)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell
                            colSpan={4}
                            className="text-lg font-bold text-right"
                          >
                            Total
                          </TableCell>
                          <TableCell className="text-lg font-bold text-right">
                            {formatCurrency(total)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableFooter>
                    </Table>
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
                            placeholder="Términos y condiciones de la cotización"
                            className="min-h-[100px]"
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
                    name="valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Válida Hasta *</FormLabel>
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
                    name="discount_percent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descuento General (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Se aplica sobre el subtotal
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                      <span>Subtotal:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {watchedDiscountPercent > 0 && (
                      <div className="flex justify-between text-sm text-red-600">
                        <span>Descuento:</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>IVA:</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 text-lg font-bold border-t">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
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
                        {isEdit ? "Actualizar" : "Crear"} Cotización
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
