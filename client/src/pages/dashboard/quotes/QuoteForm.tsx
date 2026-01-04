import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuoteStore } from "@/stores/quoteStore";
import { useClientStore, Project } from "@/stores/clientStore";
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
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, ArrowLeft, Save, Calculator } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const quoteItemSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  quantity: z.coerce.number().min(0.01, "Cantidad debe ser mayor a 0"),
  unit_price: z.coerce.number().min(0, "Precio debe ser 0 o mayor"),
});

const formSchema = z.object({
  client_id: z.coerce.number().min(1, "Selecciona un cliente"),
  project_id: z.coerce.number().nullable().optional(),
  title: z.string().min(2, "Título debe tener al menos 2 caracteres"),
  issue_date: z.string().min(1, "Fecha de emisión requerida"),
  valid_until: z.string().min(1, "Fecha de validez requerida"),
  tax_rate: z.coerce.number().min(0).max(100).default(15),
  notes: z.string().nullable().optional(),
  items: z.array(quoteItemSchema).min(1, "Agrega al menos un elemento"),
});

type FormData = z.infer<typeof formSchema>;

interface QuoteFormProps {
  mode: "create" | "edit";
}

export default function QuoteForm({ mode }: QuoteFormProps) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientProjects, setClientProjects] = useState<Project[]>([]);

  const {
    currentQuote,
    fetchQuote,
    createQuote,
    updateQuote,
    quotesLoading,
    clearCurrentQuote,
  } = useQuoteStore();

  const {
    clients,
    projects,
    fetchClients,
    fetchProjects,
    fetchProjectsByClient,
  } = useClientStore();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_id: 0,
      project_id: null,
      title: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      valid_until: format(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        "yyyy-MM-dd"
      ),
      tax_rate: 15,
      notes: "",
      items: [{ description: "", quantity: 1, unit_price: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Load clients on mount
  useEffect(() => {
    fetchClients(1, 100);
    fetchProjects(1, 100);
  }, [fetchClients, fetchProjects]);

  // Load quote in edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      fetchQuote(parseInt(id));
    }
    return () => {
      clearCurrentQuote();
    };
  }, [mode, id, fetchQuote, clearCurrentQuote]);

  // Populate form when quote is loaded
  useEffect(() => {
    if (mode === "edit" && currentQuote) {
      // Load client's projects first
      if (currentQuote.client_id) {
        fetchProjectsByClient(currentQuote.client_id);
      }

      form.reset({
        client_id: currentQuote.client_id,
        project_id: currentQuote.project_id,
        title: currentQuote.title,
        issue_date: currentQuote.issue_date,
        valid_until: currentQuote.valid_until,
        tax_rate: currentQuote.tax_rate,
        notes: currentQuote.notes || "",
        items:
          currentQuote.items?.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
          })) || [],
      });
    }
  }, [mode, currentQuote, form, fetchProjectsByClient]);

  // Update client projects when client changes
  const selectedClientId = form.watch("client_id");
  useEffect(() => {
    if (selectedClientId && selectedClientId > 0) {
      const filtered = projects.filter((p) => p.client_id === selectedClientId);
      setClientProjects(filtered);
    } else {
      setClientProjects([]);
    }
    // Reset project when client changes (except on initial load in edit mode)
    if (
      mode === "create" ||
      (mode === "edit" &&
        currentQuote &&
        selectedClientId !== currentQuote.client_id)
    ) {
      form.setValue("project_id", null);
    }
  }, [selectedClientId, projects, form, mode, currentQuote]);

  // Calculate totals
  const watchItems = form.watch("items");
  const watchTaxRate = form.watch("tax_rate");

  const subtotal = watchItems.reduce((acc, item) => {
    return acc + (item.quantity || 0) * (item.unit_price || 0);
  }, 0);

  const taxAmount = subtotal * ((watchTaxRate || 0) / 100);
  const total = subtotal + taxAmount;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-GT", {
      style: "currency",
      currency: "GTQ",
    }).format(value);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        client_id: data.client_id,
        project_id: data.project_id || null,
        title: data.title,
        issue_date: data.issue_date,
        valid_until: data.valid_until,
        tax_rate: data.tax_rate,
        notes: data.notes || null,
        items: data.items,
      };

      if (mode === "create") {
        const quote = await createQuote(payload);
        toast.success("Cotización creada exitosamente");
        navigate(`/dashboard/quotes/${quote.id}`);
      } else if (id) {
        await updateQuote(parseInt(id), payload);
        toast.success("Cotización actualizada exitosamente");
        navigate(`/dashboard/quotes/${id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Error al guardar cotización");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === "edit" && quotesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (mode === "edit" && !currentQuote && !quotesLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Cotización no encontrada</p>
        <Button variant="link" onClick={() => navigate("/dashboard/quotes")}>
          Volver a cotizaciones
        </Button>
      </div>
    );
  }

  if (mode === "edit" && currentQuote && !currentQuote.is_editable) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Esta cotización no puede ser editada porque su estado es "
          {currentQuote.status_label}"
        </p>
        <Button
          variant="link"
          onClick={() => navigate(`/dashboard/quotes/${id}`)}
        >
          Ver detalles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard/quotes")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {mode === "create" ? "Nueva Cotización" : "Editar Cotización"}
          </h2>
          <p className="text-muted-foreground">
            {mode === "create"
              ? "Crea una nueva cotización para un cliente"
              : `Editando ${currentQuote?.quote_number}`}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Datos básicos de la cotización</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={String(field.value || "")}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={String(client.id)}>
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
                      onValueChange={(value) =>
                        field.onChange(
                          value === "none" ? null : parseInt(value)
                        )
                      }
                      value={field.value ? String(field.value) : "none"}
                      disabled={clientProjects.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              clientProjects.length === 0
                                ? "Sin proyectos disponibles"
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
                      Vincula esta cotización a un proyecto existente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: Desarrollo de sitio web corporativo"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Elementos de la Cotización
              </CardTitle>
              <CardDescription>
                Agrega los productos o servicios a cotizar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[45%]">Descripción</TableHead>
                    <TableHead className="w-[15%]">Cantidad</TableHead>
                    <TableHead className="w-[20%]">Precio Unitario</TableHead>
                    <TableHead className="w-[15%]">Subtotal</TableHead>
                    <TableHead className="w-[5%]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const itemQuantity =
                      form.watch(`items.${index}.quantity`) || 0;
                    const itemPrice =
                      form.watch(`items.${index}.unit_price`) || 0;
                    const itemSubtotal = itemQuantity * itemPrice;

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
                                    placeholder="Descripción del servicio/producto"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
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
                                    placeholder="1"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
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
                                    placeholder="0.00"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(itemSubtotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() =>
                  append({ description: "", quantity: 1, unit_price: 0 })
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Elemento
              </Button>

              {/* Totals */}
              <Separator className="my-6" />
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">IVA:</span>
                      <FormField
                        control={form.control}
                        name="tax_rate"
                        render={({ field }) => (
                          <FormItem className="w-20">
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                className="text-right"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
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

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notas Adicionales</CardTitle>
              <CardDescription>
                Información adicional para el cliente (opcional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Términos y condiciones, notas especiales, etc."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/quotes")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Guardando...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === "create" ? "Crear Cotización" : "Guardar Cambios"}
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
